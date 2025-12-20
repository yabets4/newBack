import pool from "../../../loaders/db.loader.js";

export const LeadsModel = {
  // --- Helper to fetch attachments for multiple lead_ids ---
  async _fetchAttachments(companyId, leadIds) {
    if (!leadIds.length) return {};
    const result = await pool.query(
      `SELECT * FROM leads_attachments 
       WHERE company_id = $1 AND lead_id = ANY($2::text[])
       ORDER BY uploaded_at DESC`,
      [companyId, leadIds]
    );
    const map = {};
    result.rows.forEach(row => {
      if (!map[row.lead_id]) map[row.lead_id] = [];
      map[row.lead_id].push(row);
    });
    return map;
  },

  async findAll(companyId) {
    const result = await pool.query(
      `
      SELECT 
        l.lead_id,
        l.company_id,
        l.lead_type,
        l.name,
        l.primary_phone,
        l.email,
        l.address,
        l.contact_person_name,
        l.contact_person_number,
        l.contact_person_job,
        l.created_at,
        lp.assigned_to,
        lp.lead_source,
        lp.referred_by,
        lp.status,
        lp.priority,
        lp.service_requested,
        lp.notes,
        lp.created_at as profile_created_at,
        lp.updated_at as profile_updated_at
      FROM leads l
      LEFT JOIN leads_profile lp 
        ON l.company_id = lp.company_id AND l.lead_id = lp.lead_id
      WHERE l.company_id = $1
      ORDER BY l.created_at DESC
      `,
      [companyId]
    );

    const leads = result.rows;
    const leadIds = leads.map(l => l.lead_id);
    const attachmentsMap = await this._fetchAttachments(companyId, leadIds);

    return leads.map(lead => ({
      ...lead,
      attachments: attachmentsMap[lead.lead_id] || []
    }));
  },

  async findAllExisting(companyId) {
  const result = await pool.query(
    `
    SELECT 
      lead_id,
      company_id,
      lead_type,
      name,
      primary_phone,
      email,
      address,
      contact_person_name,
      contact_person_number,
      contact_person_job,
      created_at
    FROM leads
    WHERE company_id = $1
      AND customer_id IS NULL

    UNION ALL

    SELECT
      customer_id AS lead_id,
      company_id,
      customer_type AS lead_type,
      name,
      phone AS primary_phone,
      email,
      shipping_address AS address,
      contact_name AS contact_person_name,
      contact_phone AS contact_person_number,
      job_title AS contact_person_job,
      created_at
    FROM customer_profiles
    WHERE company_id = $1

    ORDER BY created_at DESC
    `,
    [companyId]
  );

  return result.rows;
},

  async createLeadOrCustomer(company_id, data, attachments = []) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let {
      lead_id,
      lead_type,
      name,
      primary_phone,
      email,
      address,
      contact_person_name,
      contact_person_number,
      contact_person_job,
      profile,
      // profile fields that may come from root
      assigned_to,
      lead_source,
      referred_by,
      status,
      priority,
      service_requested,
      notes
    } = data;

    if (!lead_id) throw new Error("lead_id must be provided.");

    let finalLeadId = lead_id;
    let customerId = null;

    if (lead_id.startsWith("CUS-")) {
      // assign customerId immediately
      customerId = lead_id;

      // check if lead already exists for this customer
      const existingLeadRes = await client.query(
        `SELECT lead_id FROM leads WHERE company_id = $1 AND customer_id = $2`,
        [company_id, customerId]
      );

      if (existingLeadRes.rows.length > 0) {
        finalLeadId = existingLeadRes.rows[0].lead_id;
      } else {
        // generate new lead_id
        const nextNumRes = await client.query(
          `UPDATE companies
           SET next_lead_number = next_lead_number + 1
           WHERE company_id = $1
           RETURNING next_lead_number`,
          [company_id]
        );
        finalLeadId = `LEAD-${String(nextNumRes.rows[0].next_lead_number).padStart(2, "0")}`;

        // insert into leads
        const insertLeadQuery = `
          INSERT INTO leads (
            company_id, customer_id, lead_id, lead_type, name, primary_phone, email, address, contact_person_name, contact_person_number, contact_person_job
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `;
        await client.query(insertLeadQuery, [
          company_id,
          customerId,
          finalLeadId,
          lead_type,
          name,
          primary_phone,
          email,
          address,
          contact_person_name,
          contact_person_number,
          contact_person_job
        ]);
      }
    } else if (lead_id.startsWith("LEAD-")) {
      // existing lead
      finalLeadId = lead_id;
    } else {
      throw new Error("Invalid lead_id prefix. Must start with 'CUS-' or 'LEAD-'.");
    }

    // Use profile object if provided, otherwise fallback to root fields
    const profileData = profile || {
      assigned_to,
      lead_source,
      referred_by,
      status,
      priority,
      service_requested,
      notes
    };

    // insert into leads_profile
    if (profileData) {
      const insertProfileQuery = `
        INSERT INTO leads_profile (
          company_id, lead_id, assigned_to, lead_source, referred_by, status, priority, service_requested, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `;
      await client.query(insertProfileQuery, [
        company_id,
        finalLeadId,
        profileData.assigned_to,
        profileData.lead_source,
        profileData.referred_by || null,
        profileData.status || 'New',
        profileData.priority || 'Medium',
        profileData.service_requested,
        profileData.notes || null
      ]);
    }

    // insert attachments
    for (let i = 0; i < (attachments.length || 0); i++) {
      const file = attachments[i];
      await client.query(`
        INSERT INTO leads_attachments (company_id, lead_id, file_url, description)
        VALUES ($1, $2, $3, $4)
      `, [company_id, finalLeadId, file.file_url, file.description || (data.attachment_descriptions ? data.attachment_descriptions[i] : null)]);
    }

    await client.query('COMMIT');
    return { success: true, lead_id: finalLeadId, customer_id: customerId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

,

  // --- Fetch single lead with attachments ---
  async findById(companyId, leadId) {
    const result = await pool.query(
      `
      SELECT 
        l.lead_id,
        l.company_id,
        l.lead_type,
        l.name,
        l.primary_phone,
        l.email,
        l.address,
        l.contact_person_name,
        l.contact_person_number,
        l.contact_person_job,
        l.created_at,
        lp.*
      FROM leads l
      LEFT JOIN leads_profile lp 
        ON l.company_id = lp.company_id AND l.lead_id = lp.lead_id
      WHERE l.company_id = $1 AND l.lead_id = $2
      LIMIT 1
      `,
      [companyId, leadId]
    );

    if (!result.rows.length) return null;

    const lead = result.rows[0];
    const attachments = await this._fetchAttachments(companyId, [leadId]);
    return { ...lead, attachments: attachments[leadId] || [] };
  },

  // --- Insert lead + attachments together ---
  async insert(companyId, data, attachments = []) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if phone already exists for this company
      const exists = await client.query(
        `SELECT 1 FROM leads 
         WHERE company_id = $1 AND primary_phone = $2`,
        [companyId, data.primary_phone]
      );

      if (exists.rowCount > 0) {
        await client.query("ROLLBACK");
        return null; // phone exists, do not create lead
      }

      // Increment next_lead_number
      const nextNumRes = await client.query(
        `UPDATE companies
         SET next_lead_number = next_lead_number + 1
         WHERE company_id = $1
         RETURNING next_lead_number`,
        [companyId]
      );

      const lead_id = `LEAD-${String(nextNumRes.rows[0].next_lead_number).padStart(2, "0")}`;

      // Insert into leads
      const leadRes = await client.query(
        `INSERT INTO leads (
          company_id, lead_id, lead_type, name, primary_phone, email, address,
          contact_person_name, contact_person_number, contact_person_job
        )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          companyId,
          lead_id,
          data.lead_type,
          data.name,
          data.primary_phone,
          data.email,
          data.address,
          data.contact_person_name,
          data.contact_person_number,
          data.contact_person_job
        ]
      );
      const lead = leadRes.rows[0];

      // Insert profile
      const profileRes = await client.query(
        `INSERT INTO leads_profile (
          company_id, lead_id, assigned_to, lead_source, referred_by,
          status, priority, service_requested, notes
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *`,
        [
          companyId,
          lead_id,
          data.assigned_to,
          data.lead_source,
          data.referred_by,
          data.status || "New",
          data.priority || "Medium",
          data.service_requested,
          data.notes || null,
        ]
      );

      // Insert attachments if any
      const insertedAttachments = [];
      for (const att of attachments) {
        const attRes = await client.query(
          `INSERT INTO leads_attachments (company_id, lead_id, file_url, description)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [companyId, lead_id, att.file_url, att.description || null]
        );
        insertedAttachments.push(attRes.rows[0]);
      }

      await client.query("COMMIT");

      return { ...lead, latest_profile: profileRes.rows[0], attachments: insertedAttachments };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  // --- Update lead + attachments ---
  async update(companyId, leadId, data, newAttachments = [], existingAttachments = []) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update lead core info
      await client.query(
        `UPDATE leads
         SET
           lead_type = COALESCE($1, lead_type),
           name = COALESCE($2, name),
           primary_phone = COALESCE($3, primary_phone),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           contact_person_name = COALESCE($6, contact_person_name),
           contact_person_number = COALESCE($7, contact_person_number),
           contact_person_job = COALESCE($8, contact_person_job)
         WHERE company_id = $9 AND lead_id = $10`,
        [
          data.lead_type,
          data.name,
          data.primary_phone,
          data.email,
          data.address,
          data.contact_person_name,
          data.contact_person_number,
          data.contact_person_job,
          companyId,
          leadId,
        ]
      );

      // Update lead profile
      const profileRes = await client.query(
        `UPDATE leads_profile
         SET
           assigned_to = COALESCE($1, assigned_to),
           lead_source = COALESCE($2, lead_source),
           referred_by = COALESCE($3, referred_by),
           status = COALESCE($4, status),
           priority = COALESCE($5, priority),
           service_requested = COALESCE($6, service_requested),
           notes = COALESCE($7, notes),
           updated_at = CURRENT_TIMESTAMP
         WHERE company_id = $8 AND lead_id = $9
         RETURNING *`,
        [
          data.assigned_to,
          data.lead_source,
          data.referred_by,
          data.status,
          data.priority,
          data.service_requested,
          data.notes,
          companyId,
          leadId,
        ]
      );

      // Delete attachments that were removed in the frontend: keep only those provided
      if (Array.isArray(existingAttachments)) {
        const keptIds = existingAttachments.map(a => a.id).filter(Boolean);

        if (keptIds.length === 0) {
          // No existing attachments were kept -> remove all existing attachments for this lead
          await client.query(
            `DELETE FROM leads_attachments WHERE company_id=$1 AND lead_id=$2`,
            [companyId, leadId]
          );
        } else {
          // Delete attachments whose id is NOT in the keptIds list
          // Build parameter placeholders for the id list
          const placeholders = keptIds.map((_, i) => `$${i + 3}`).join(',');
          const sql = `DELETE FROM leads_attachments WHERE company_id=$1 AND lead_id=$2 AND id NOT IN (${placeholders})`;
          await client.query(sql, [companyId, leadId, ...keptIds]);
        }

        // Update descriptions for the attachments that remain
        for (const att of existingAttachments) {
          await client.query(
            `UPDATE leads_attachments SET description=$1 
             WHERE company_id=$2 AND lead_id=$3 AND id=$4`,
            [att.description || null, companyId, leadId, att.id]
          );
        }
      }

      // Insert new attachments
      for (const att of newAttachments) {
        await client.query(
          `INSERT INTO leads_attachments (company_id, lead_id, file_url, description)
           VALUES ($1, $2, $3, $4)`,
          [companyId, leadId, att.file_url, att.description || null]
        );
      }

      await client.query("COMMIT");

      // Fetch all attachments including existing ones
      const allAttachments = await this._fetchAttachments(companyId, [leadId]);

      return { ...profileRes.rows[0], attachments: allAttachments[leadId] || [] };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  // --- Delete lead (attachments cascade automatically via FK) ---
  async remove(companyId, leadId) {
    const result = await pool.query(
      `DELETE FROM leads
       WHERE company_id = $1 AND lead_id = $2
       RETURNING *`,
      [companyId, leadId]
    );
    return result.rows[0];
  }
};
