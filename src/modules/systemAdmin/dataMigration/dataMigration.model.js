import pool from '../../../loaders/db.loader.js';

export default class CompanyModel {
  constructor() {}

  async getCompanyByName(company_name) {
    const res = await pool.query(
      `SELECT * FROM company_profiles WHERE company_name = $1`,
      [company_name]
    );
    return res.rows[0]; // Return single company, you can join more tables if needed
  }
}
