import pool from '../../../loaders/db.loader.js';


async function getCompanyTelegramTokenById(companyId) {
  if (!companyId) throw new Error('companyId is required');

  const q = `SELECT token_secret FROM companies WHERE company_id = $1 LIMIT 1`;
  const { rows } = await pool.query(q, [companyId]);
  if (!rows || rows.length === 0) return null;
  return rows[0].token_secret || null;
}

export async function getCompanyTelegramToken(req) {
  const { companyID } = req && req.auth ? req.auth : {};
  if (!companyID) {
    throw new Error('companyID not found on req.auth');
  }
  return getCompanyTelegramTokenById(companyID);
}


export default getCompanyTelegramToken;
