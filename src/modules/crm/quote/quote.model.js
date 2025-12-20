import pool from "../../../loaders/db.loader.js";

export const QuoteModel = {
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


    async getAllLeads(companyId) {
    try {
      // 1️⃣ Fetch all leads
      const leadsQuery = `
        SELECT lead_id, name, address
        FROM leads
        WHERE company_id = $1
        ORDER BY created_at DESC
      `;
      const { rows: leads } = await pool.query(leadsQuery, [companyId]);

      // 2️⃣ Fetch all profiles
      const profileQuery = `
        SELECT lead_id, service_requested, updated_at
        FROM leads_profile
        WHERE company_id = $1
        ORDER BY updated_at DESC
      `;
      const { rows: profiles } = await pool.query(profileQuery, [companyId]);

      // 3️⃣ Group profiles by lead_id
      const profileMap = {};
      for (const p of profiles) {
        if (!profileMap[p.lead_id]) profileMap[p.lead_id] = [];
        profileMap[p.lead_id].push({ ...p, attachments: [] }); // add attachments array to each profile
      }

      // 4️⃣ Fetch all attachments
      const attachmentQuery = `
        SELECT lead_id, file_url, description, uploaded_at
        FROM leads_attachments
        WHERE company_id = $1
        ORDER BY uploaded_at ASC
      `;
      const { rows: attachments } = await pool.query(attachmentQuery, [companyId]);

      // 5️⃣ Assign attachments to profiles by matching timestamps
      for (const att of attachments) {
        const leadProfiles = profileMap[att.lead_id] || [];
        for (const profile of leadProfiles) {
          if (att.uploaded_at >= profile.updated_at) {
            profile.attachments.push(att);
          }
        }
      }

      // 6️⃣ Combine profiles into leads
      const leadsWithProfilesAndAttachments = leads.map(lead => ({
        ...lead,
        profiles: profileMap[lead.lead_id] || []
      }));

      return leadsWithProfilesAndAttachments;

    } catch (error) {
      console.error('Error fetching leads with profiles and attachments:', error);
      throw new Error('Could not fetch leads');
    }
  },

  async findAll(companyId) {
    const { rows } = await pool.query(
      `SELECT * FROM quotes WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    );
    
    return rows;
  },

  /** Get one quote with nested items + attachments */
  async findById(companyId, quoteId) {
    // header
    const { rows: quoteRows } = await pool.query(
      `SELECT * FROM quotes WHERE company_id = $1 AND quote_id = $2 LIMIT 1`,
      [companyId, quoteId]
    );
    if (!quoteRows.length) return null;
    const quote = quoteRows[0];

    // items
    const { rows: itemRows } = await pool.query(
      `SELECT * FROM quote_items WHERE company_id = $1 AND quote_id = $2 ORDER BY id`,
      [companyId, quoteId]
    );

    // attach attachments to each item
    for (const item of itemRows) {
      const { rows: atts } = await pool.query(
        `SELECT * FROM quote_item_attachments WHERE company_id = $1 AND quote_item_id = $2 ORDER BY id`,
        [companyId, item.id]
      );
      item.attachments = atts;
    }

    // quote-level attachments
    const { rows: quoteAtts } = await pool.query(
      `SELECT * FROM quote_attachments WHERE company_id = $1 AND quote_id = $2 ORDER BY id`,
      [companyId, quoteId]
    );

    return { ...quote, items: itemRows, attachments: quoteAtts };
  },

  /** Create a full quote with items and attachments in one transaction */
  async insert(companyId, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const nextNumRes = await client.query(
      `UPDATE companies
       SET next_quote_number = next_quote_number + 1
       WHERE company_id = $1
       RETURNING next_quote_number`,
      [companyId]
    );
    if (!nextNumRes.rows[0]) {
  throw new Error(`Company not found: ${companyId}`);
}
    
    const nextNum = nextNumRes.rows[0].next_quote_number;
    const quote_id = `QUO-${String(nextNum).padStart(3, '0')}`;
    console.log(quote_id);
    
    const { rows: quoteRows } = await client.query(
      `INSERT INTO quotes (
        company_id, lead_id, quote_id, service_inquired,
        discount_percent, tax_rate, expiration_date,
        internal_margin_percent, version, status,
        payment_terms, delivery_terms
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9,$10,$11)
      RETURNING *`,
      [
        companyId,
        data.lead_id || null,
        quote_id,
        data.service_inquired,
        data.discount_percent || 0,
        data.tax_rate || 15.0,
        data.expiration_date,
        data.internal_margin_percent || 0,
        data.status || 'Draft',
        data.payment_terms,
        data.delivery_terms,
      ]
    );
    const quote = quoteRows[0];
    
    const itemsWithIds = [];
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        const { rows: itemRows } = await client.query(
          `INSERT INTO quote_items (company_id, quote_id, name, quantity, unit_price, description)
           VALUES ($1,$2,$3,$4,$5,$6)
           RETURNING *`,
          [
            companyId,
            quote_id,
            item.name,
            item.quantity || 1,
            item.unit_price || 0,
            item.description || null,
          ]
        );
        const newItem = itemRows[0];

        if (Array.isArray(item.attachments)) {
          for (const att of item.attachments) {
            await client.query(
              `INSERT INTO quote_item_attachments (company_id, quote_item_id, file_url, file_type, description)
               VALUES ($1,$2,$3,$4,$5)`,
              [
                companyId,
                newItem.id,
                att.file_url,
                att.file_type || null,
                att.description || null,
              ]
            );
          }
        }

        itemsWithIds.push(newItem);
      }
    }
    
    if (Array.isArray(data.attachments)) {
      for (const att of data.attachments) {
        await client.query(
          `INSERT INTO quote_attachments (company_id, quote_id, file_url, description)
           VALUES ($1,$2,$3,$4)`,
          [companyId, quote_id, att.file_url, att.description || null]
        );
      }
    }

    await client.query('COMMIT');
    return { ...quote, items: itemsWithIds };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
,

  
  async update(companyId, quoteId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update the main quote table fields
      const quoteFields = [];
      const quoteValues = [];
      let i = 1;
      for (const key in data) {
        if (key === 'items' || key === 'attachments' || key === 'quote_id' || key === 'company_id') continue;
        quoteFields.push(`${key} = $${i++}`);
        quoteValues.push(data[key]);
      }

      console.log('Updating quote fields:', quoteFields);
      console.log('With values:', quoteValues);

      if (quoteFields.length > 0) {
        quoteValues.push(companyId, quoteId);
        await client.query(
          `UPDATE quotes
           SET ${quoteFields.join(', ')}, updated_at = NOW()
           WHERE company_id = $${i} AND quote_id = $${i + 1}`,
          quoteValues
        );
        console.log('Quote updated');
      }

      // 2. Handle quote items (delete and re-insert)
      if (Array.isArray(data.items)) {
        // First, get old item IDs to delete their attachments
        const { rows: oldItems } = await client.query(
          `SELECT id FROM quote_items WHERE company_id = $1 AND quote_id = $2`,
          [companyId, quoteId]
        );
        const oldItemIds = oldItems.map(item => item.id);
        console.log('Old item IDs:', oldItemIds);

        if (oldItemIds.length > 0) {
          await client.query(`DELETE FROM quote_item_attachments WHERE quote_item_id = ANY($1)`, [oldItemIds]);
          await client.query(`DELETE FROM quote_items WHERE id = ANY($1)`, [oldItemIds]);
          console.log('Old items and attachments deleted');
        }

        // Now, insert new items and their attachments
        for (const item of data.items) {
          console.log('Inserting item:', item);
          const { rows: newItemRows } = await client.query(
            `INSERT INTO quote_items (company_id, quote_id, name, quantity, unit_price, description)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [companyId, quoteId, item.name, item.quantity || 1, item.unit_price || item.price || 0, item.description || null]
          );
          const newItemId = newItemRows[0].id;
          console.log('New item ID:', newItemId);

          if (Array.isArray(item.attachments)) {
            for (const att of item.attachments) {
              console.log('Inserting item attachment:', att);
              await client.query(
                `INSERT INTO quote_item_attachments (company_id, quote_item_id, file_url, file_type, description)
                 VALUES ($1, $2, $3, $4, $5)`,
                [companyId, newItemId, att.file_url, att.file_type || null, att.description || null]
              );
            }
          }
        }
        console.log('All new items and attachments inserted');
      }

      // 3. Handle quote-level attachments (delete and re-insert)
      if (Array.isArray(data.attachments)) {
        await client.query(`DELETE FROM quote_attachments WHERE company_id = $1 AND quote_id = $2`, [companyId, quoteId]);
        console.log('Old quote-level attachments deleted');
        for (const att of data.attachments) {
          console.log('Inserting quote-level attachment:', att);
          await client.query(
            `INSERT INTO quote_attachments (company_id, quote_id, file_url, description) VALUES ($1, $2, $3, $4)`,
            [companyId, quoteId, att.file_url, att.description || null]
          );
        }
        console.log('All new quote-level attachments inserted');
      }

      await client.query('COMMIT');
      console.log('Quote update transaction committed');
      return this.findById(companyId, quoteId); // Return the fully updated quote
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error during quote update:', err);
      throw err;
    } finally {
      client.release();
    }
  },
  
  async remove(companyId, quoteId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT * FROM quotes WHERE company_id = $1 AND quote_id = $2`,
        [companyId, quoteId]
      );
      if (!rows.length) {
        await client.query('ROLLBACK');
        return null;
      }
      // all children cascade delete in DB
      await client.query(
        `DELETE FROM quotes WHERE company_id = $1 AND quote_id = $2`,
        [companyId, quoteId]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
  }