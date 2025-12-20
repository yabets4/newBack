import pool from "../../loaders/db.loader.js"; // or whatever DB wrapper you use

export async function getCompanyNameById(companyID) {
  try {
    const { rows } = await pool.query('SELECT company_name FROM companies WHERE company_id = $1', [companyID]);
    // return the correct column, with safe fallback
    return rows[0]?.company_name || null;
  } catch (err) {
    console.log('getCompanyNameById error', err);
    return null;
  }
}
