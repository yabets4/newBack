import pool from '../../loaders/db.loader.js';

// Check whether an email exists in customers or leads for a company
export async function isEmailRegistered(companyId, email) {
  if (!companyId) throw new Error('companyId is required');
  if (!email) return { exists: false };

  // Check customer profiles (case-insensitive)
  const custRes = await pool.query(
    `SELECT customer_id FROM customer_profiles WHERE company_id = $1 AND lower(email) = lower($2) LIMIT 1`,
    [companyId, email]
  );
  if (custRes.rows && custRes.rows.length > 0) {
    return { exists: true, where: 'customer', id: custRes.rows[0].customer_id };
  }

  // Check leads (case-insensitive)
  const leadRes = await pool.query(
    `SELECT lead_id FROM leads WHERE company_id = $1 AND lower(email) = lower($2) LIMIT 1`,
    [companyId, email]
  );
  if (leadRes.rows && leadRes.rows.length > 0) {
    return { exists: true, where: 'lead', id: leadRes.rows[0].lead_id };
  }

  return { exists: false };
}

export async function ensureEmailNotRegistered(companyId, email) {
  const res = await isEmailRegistered(companyId, email);
  if (res.exists) {
    const err = new Error(`Email already registered in ${res.where}`);
    err.code = 'ALREADY_EXISTS';
    err.existingId = res.id;
    throw err;
  }
  return true;
}
