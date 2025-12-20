// src/modules/systemAdmin/customers/customer.model.js
import pool from '../../../loaders/db.loader.js';

export const CustomersModel = {
  async findAll(companyId) {
  const result = await pool.query(
    `
    SELECT 
      c.id,
      c.customer_id,
      c.company_id,
      c.created_at,
      cp.customer_type,
      cp.name,
      cp.contact_name,
      cp.contact_phone,
      cp.job_title,
      cp.email,
      cp.phone,
      cp.billing_address,
      cp.shipping_address,
      cp.tin_number,
      cp.photo_url,
      cp.gender,
      cp.birthday
    FROM customers c
    LEFT JOIN customer_profiles cp 
      ON c.company_id = cp.company_id AND c.customer_id = cp.customer_id
    WHERE c.company_id = $1
    ORDER BY c.created_at DESC
    `,
    [companyId]
  );
  return result.rows;
},

  async findById(companyId, customerId) {
  // Step 1: Fetch customer + profile + lead
  const baseQuery = await pool.query(
    `
    SELECT 
      c.id,
      c.customer_id,
      c.company_id,
      c.created_at,

      -- Profile data
      cp.customer_type,
      cp.name,
      cp.contact_name,
      cp.contact_phone,
      cp.job_title,
      cp.email,
      cp.phone,
      cp.billing_address,
      cp.shipping_address,
      cp.tin_number,
      cp.photo_url,
      cp.gender,
      cp.birthday,

      -- Lead info
      l.lead_id,
      l.lead_type,
      l.primary_phone AS lead_primary_phone,
      l.email AS lead_email,

      -- Lead profile
      lp.status AS lead_status,
      lp.priority AS lead_priority,
      lp.service_requested,
      lp.assigned_to

    FROM customers c
    LEFT JOIN customer_profiles cp 
      ON c.company_id = cp.company_id 
     AND c.customer_id = cp.customer_id

    LEFT JOIN leads l
      ON l.company_id = c.company_id
     AND l.customer_id = c.customer_id

    LEFT JOIN leads_profile lp
      ON lp.company_id = l.company_id
     AND lp.lead_id = l.lead_id

    WHERE c.company_id = $1 
      AND c.customer_id = $2
    LIMIT 1
    `,
    [companyId, customerId]
  );

  const customer = baseQuery.rows[0];
  if (!customer) return null;

  const leadId = customer.lead_id || null;

  // Step 2: Fetch metrics only if lead_id exists
  let metrics = {
    total_orders: 0,
    total_revenue: 0,
    last_payment: null,
    overdue_amount: 0,
  };

  if (leadId) {
    const metricsQuery = await pool.query(
      `
      SELECT 
        (SELECT COUNT(*) 
         FROM orders o 
         WHERE o.company_id = $1 AND o.lead_id = $2) AS total_orders,

        (SELECT COALESCE(SUM(total_amount),0)
         FROM orders o 
         WHERE o.company_id = $1 AND o.lead_id = $2) AS total_revenue,

        (SELECT MAX(updated_at)
         FROM orders o
         WHERE o.company_id = $1 
           AND o.lead_id = $2
           AND o.status='Completed') AS last_payment,

        (SELECT COALESCE(SUM(total_amount),0)
         FROM orders o
         WHERE o.company_id = $1
           AND o.lead_id = $2
           AND o.delivery_date < CURRENT_DATE - INTERVAL '60 days'
           AND o.status!='Completed') AS overdue_amount
      `,
      [companyId, leadId]
    );

    metrics = metricsQuery.rows[0];
  }

  // Step 3: return everything merged
  return {
    ...customer,
    metrics,
  };
},



  async insert(companyId, data) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Step 1: Get next customer number
    const nextNumRes = await client.query(
      `UPDATE companies
       SET next_customer_number = next_customer_number + 1
       WHERE company_id = $1
       RETURNING next_customer_number`,
      [companyId]
    );
    const nextNum = nextNumRes.rows[0].next_customer_number;
    const customer_id = `CUS-${String(nextNum).padStart(2, "0")}`;

    // Step 2: Insert into customers
    const customerRes = await client.query(
      `INSERT INTO customers (company_id, customer_id)
       VALUES ($1, $2)
       RETURNING id, company_id, customer_id`,
      [companyId, customer_id]
    );
    const customer = customerRes.rows[0];

    // Step 3: Insert into customer_profiles with company_id for FK
    const profileRes = await client.query(
      `INSERT INTO customer_profiles (
        company_id, customer_id, customer_type, name, contact_name, contact_phone,
        job_title, email, phone, billing_address, shipping_address,
        tin_number, photo_url, gender, birthday
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        customer.company_id,
        customer.customer_id,
        data.customer_type || "Individual",
        data.name || "Unnamed",
        data.contact_name || null,
        data.contact_phone || null,
        data.job_title || null,
        data.email || null,
        data.phone || null,
        data.billing_address || null,
        data.shipping_address || null,
        data.tin_number || null,
        data.photo_url || null,
        data.gender || null,
        data.birthday || null,
      ]
    );

    await client.query("COMMIT");

    return { ...customer, latest_profile: profileRes.rows[0] };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
,


  async update(companyId, customerId, data) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sanitizedData = {};
    for (const key in data) {
      sanitizedData[key] = data[key] !== undefined ? data[key] : null;
    }

    // Try to update first. Using UPDATE avoids relying on a UNIQUE constraint
    // that may not exist on (company_id, customer_id) in customer_profiles.
    const updateQuery = `
      UPDATE customer_profiles SET
        customer_type = $3,
        name = $4,
        email = $5,
        phone = $6,
        tin_number = $7,
        billing_address = $8,
        shipping_address = $9,
        photo_url = $10,
        gender = $11,
        birthday = $12,
        contact_name = $13,
        contact_phone = $14,
        job_title = $15,
        updated_at = NOW()
      WHERE company_id = $1 AND customer_id = $2
      RETURNING *;
    `;

    const values = [
      companyId,
      customerId,
      sanitizedData.customer_type || "Individual",
      sanitizedData.name || "Unnamed",
      sanitizedData.email || null,
      sanitizedData.phone || null,
      sanitizedData.tin_number || null,
      sanitizedData.billing_address || null,
      sanitizedData.shipping_address || null,
      sanitizedData.photo_url || null,
      sanitizedData.gender || null,
      sanitizedData.birthday || null,
      sanitizedData.contact_name || null,
      sanitizedData.contact_phone || null,
      sanitizedData.job_title || null,
    ];

    let result = await client.query(updateQuery, values);

    // If no existing profile was updated, insert a new profile row
    if (result.rows.length === 0) {
      const insertQuery = `
        INSERT INTO customer_profiles (
          company_id, customer_id, customer_type, name, contact_name, contact_phone,
          job_title, email, phone, billing_address, shipping_address, tin_number,
          photo_url, gender, birthday, created_at
        ) VALUES ($1,$2,$3,$4,$13,$14,$15,$5,$6,$8,$9,$7,$10,$11,$12,NOW())
        RETURNING *;
      `;

      const insertValues = [
        companyId,
        customerId,
        sanitizedData.customer_type || "Individual",
        sanitizedData.name || "Unnamed",
        sanitizedData.email || null,
        sanitizedData.phone || null,
        sanitizedData.tin_number || null,
        sanitizedData.billing_address || null,
        sanitizedData.shipping_address || null,
        sanitizedData.photo_url || null,
        sanitizedData.gender || null,
        sanitizedData.birthday || null,
        sanitizedData.contact_name || null,
        sanitizedData.contact_phone || null,
        sanitizedData.job_title || null,
      ];

      result = await client.query(insertQuery, insertValues);
    }

    await client.query("COMMIT");
    return result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
},


  async remove(companyId, customerId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get customer with profile before deletion
    const beforeDelete = await client.query(
      `
      SELECT 
        c.id,
        c.customer_id,
        c.company_id,
        c.created_at,
        cp.customer_type,
        cp.name,
        cp.contact_name,
        cp.contact_phone,
        cp.job_title,
        cp.email,
        cp.phone,
        cp.billing_address,
        cp.shipping_address,
        cp.tin_number,
        cp.photo_url,
        cp.gender,
        cp.birthday
      FROM customers c
      LEFT JOIN customer_profiles cp 
        ON c.company_id = cp.company_id AND c.customer_id = cp.customer_id
      WHERE c.company_id = $1 AND c.customer_id = $2
      `,
      [companyId, customerId]
    );

    if (beforeDelete.rows.length === 0) {
      await client.query("ROLLBACK");
      return null; // no customer found
    }

    // Delete customer (profile auto-deletes due to cascade)
    await client.query(
      "DELETE FROM customers WHERE company_id = $1 AND customer_id = $2",
      [companyId, customerId]
    );

    await client.query("COMMIT");
    return beforeDelete.rows[0]; // return deleted record
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
},
};
