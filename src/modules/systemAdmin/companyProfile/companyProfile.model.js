import pool from '../../../loaders/db.loader.js';

export default class CompanyProfileModel {
  constructor() {}

  // --- CRUD Operations ---
  
  // List companies with optional filters
 async findCompanies(opts = {}) {
  const { limit = 100, offset = 0 } = opts;

  const res = await pool.query(
    `
    SELECT t1.*
    FROM company_profiles t1
    INNER JOIN (
        SELECT company_id, MAX(id) AS max_id
        FROM company_profiles
        GROUP BY company_id
    ) t2
    ON t1.company_id = t2.company_id AND t1.id = t2.max_id
    ORDER BY t1.id DESC
    LIMIT $1 OFFSET $2;
    `,
    [limit, offset]
  );

  return res.rows;
}


  // Find a single company by ID
  async findCompanyById(id) {
    const res = await pool.query(
      `SELECT * FROM company_profiles WHERE company_id = $1`,
      [id]
    );
    return res.rows || null;
  }

  // Create a new company profile
  async createCompany(data) {
    const {
      company_name,
      legal_name,
      registration_number,
      physical_address,
      default_currency,
      industry,
      business_model,
      pricing_tier,
      company_logo,
      tin_document,
      business_license,
      trade_license,
      status = 'Trial'
    } = data;

    const res = await pool.query(
      `INSERT INTO company_profiles 
        (company_name, legal_name, registration_number, physical_address, default_currency, industry, business_model, pricing_tier, company_logo, tin_document, business_license, trade_license, status) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [company_name, legal_name, registration_number, physical_address, default_currency, industry, business_model, pricing_tier, company_logo, tin_document, business_license, trade_license, status]
    );
    return res.rows[0];
  }

  // Update company profile
  async updateCompany(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setQuery = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');

    const res = await pool.query(
      `UPDATE company_profiles SET ${setQuery}, updated_at=NOW() WHERE id=$${fields.length + 1} RETURNING *`,
      [...values, id]
    );
    return res.rows[0] || null;
  }

  // Delete company profile
  async deleteCompany(id) {
    await pool.query(`DELETE FROM company_profiles WHERE id=$1`, [id]);
    return true;
  }

   async setStatus(id, status) {
  const allowedStatuses = ['Active', 'Suspended', 'Deactivated', 'Trial'];
  if (!allowedStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the latest company row
    const { rows } = await client.query(
      `SELECT * FROM company_profiles WHERE id=$1`,
      [id]
    );
    if (rows.length === 0) {
      throw new Error(`Company not found for id=${id}`);
    }
    const company = rows[0];

    // Insert a new row with the new status (duplicate all fields)
    const res = await client.query(
      `INSERT INTO company_profiles (
        company_id, company_name, legal_name, registration_number,
        physical_address, default_currency, industry, business_model,
        pricing_tier, company_logo, tin_document, business_license,
        trade_license, status, created_at, updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW()
      )
      RETURNING *`,
      [
        company.company_id,
        company.company_name,
        company.legal_name,
        company.registration_number,
        company.physical_address,
        company.default_currency,
        company.industry,
        company.business_model,
        company.pricing_tier,
        company.company_logo,
        company.tin_document,
        company.business_license,
        company.trade_license,
        status
      ]
    );

    await client.query('COMMIT');
    return res.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async activate(id) {
  return this.setStatus(id, 'Active');
}

async suspend(id) {
  return this.setStatus(id, 'Suspended');
}

async deactivate(id) {
  return this.setStatus(id, 'Deactivated');
}

async trial(id) {
  return this.setStatus(id, 'Trial');
}
}
