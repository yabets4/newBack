import pool from '../../../loaders/db.loader.js';

export default class CompanyModel {
  // CREATE
  static async createCompany(data) {
  const seqRes = await pool.query("SELECT nextval('company_id_seq') as next_id");
  const nextIdNumber = seqRes.rows[0].next_id;
  const company_id = `comp-${String(nextIdNumber).padStart(3, '0')}`;

  // 2. Insert into companies table
  const companyQuery = `
    INSERT INTO companies (company_id, company_name)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const companyRes = await pool.query(companyQuery, [company_id, data.company_name]);

  // 3. Insert initial profile snapshot
  const profileQuery = `
    INSERT INTO company_profiles
    (company_id, company_name, legal_name, registration_number, physical_address,
     default_currency, industry, business_model, pricing_tier, company_logo,
     tin_document, business_license, trade_license, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING *;
  `;
  const profileValues = [
    company_id,
    data.company_name,
    data.legal_name,
    data.registration_number,
    data.physical_address,
    data.default_currency,
    data.industry,
    data.business_model,
    data.pricing_tier,
    data.company_logo,
    data.tin_document,
    data.business_license,
    data.trade_license,
    data.status || 'Trial'
  ];
  const profileRes = await pool.query(profileQuery, profileValues);

  return {
    ...companyRes.rows[0],
    latest_profile: profileRes.rows[0]
  };
}


  // READ ALL
  static async fetchAllCompanies() {
    const result = await pool.query('SELECT * FROM company_profiles ORDER BY created_at DESC');
    return result.rows;
  }

  // READ ONE
  static async fetchCompanyById(company_id) {
    const result = await pool.query('SELECT * FROM company_profiles WHERE company_id=$1', [company_id]);
    return result.rows[0];
  }

  // UPDATE
  static async updateCompany(company_id, data) {
    const setFields = [];
    const values = [];
    let idx = 1;

    for (let key in data) {
      if (data[key] !== undefined) {
        setFields.push(`${key}=$${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    const query = `
      UPDATE company_profiles
      SET ${setFields.join(', ')}, updated_at=NOW()
      WHERE company_id=$${idx}
      RETURNING *;
    `;
    values.push(company_id);
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // DELETE
  static async deleteCompany(company_id) {
    await pool.query('DELETE FROM company_profiles WHERE company_id=$1', [company_id]);
  }


  static async createUser(data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { company_id, name, email, phone, password, role } = data;

    // Step 1: Get next user number
    const nextNumQuery = `
      UPDATE companies
      SET next_user_number = next_user_number + 1
      WHERE company_id = $1
      RETURNING next_user_number;
    `;
    const numRes = await client.query(nextNumQuery, [company_id]);
    const nextNum = numRes.rows[0].next_user_number;

    const user_id = `USR-${String(nextNum).padStart(2, '0')}`;

    // Step 2: Insert into users
    const userInsert = `
      INSERT INTO users (company_id, user_id)
      VALUES ($1, $2)
      RETURNING id, company_id, user_id;
    `;
    const userRes = await client.query(userInsert, [company_id, user_id]);
    const user = userRes.rows[0];

    // Step 3: Insert into user_profiles with company_id for the FK
    const profileInsert = `
      INSERT INTO user_profiles
      (company_id, user_id, name, email, phone, password, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const profileRes = await client.query(profileInsert, [
      user.company_id, // add company_id here
      user.user_id,
      name,
      email,
      phone,
      password,
      role
    ]);

    await client.query('COMMIT');

    return {
      ...user,
      latest_profile: profileRes.rows[0],
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}





  static async createPayment(data) {
    const { company_id, billing_contact_name, billing_email, billing_address, payment_method, payment_details } = data;
    const query = `
      INSERT INTO payments
      (company_id, billing_contact_name, billing_email, billing_address, payment_method, payment_details)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *;
    `;
    const values = [company_id, billing_contact_name, billing_email, billing_address, payment_method, payment_details];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async createLocations(company_id, locations) {
    const query = `
      INSERT INTO locations (company_id, name, address, contact, operational_hours)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *;
    `;

    const results = [];
    for (let loc of locations) {
      const values = [company_id, loc.name, loc.address, loc.contact, loc.operational_hours];
      const res = await pool.query(query, values);
      results.push(res.rows[0]);
    }
    return results;
  }
}
