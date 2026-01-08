import pool from '../../../loaders/db.loader.js';

const TaxModel = {
  async getSettings(companyId) {
    const res = await pool.query(`SELECT * FROM tax_settings WHERE company_id = $1 LIMIT 1`, [companyId]);
    return res.rows[0] || null;
  },

  async upsertSettings(companyId, payload) {
    const id = payload.id || 'default';
    const res = await pool.query(
      `INSERT INTO tax_settings (company_id, id, settings, created_at, updated_at)
       VALUES ($1,$2,$3,NOW(),NOW())
       ON CONFLICT (company_id, id) DO UPDATE SET settings = $3, updated_at = NOW()
       RETURNING *`,
      [companyId, id, payload.settings || {}]
    );
    return res.rows[0] || null;
  },

  async listFilings(companyId) {
    const res = await pool.query(`SELECT * FROM tax_filings WHERE company_id = $1 ORDER BY created_at DESC`, [companyId]);
    return res.rows || [];
  },

  async createFiling(companyId, payload) {
    const res = await pool.query(
      `INSERT INTO tax_filings (company_id, period, total_tax, data, created_at)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING *`,
      [companyId, payload.period, payload.totalTax || 0, payload.data || {}]
    );
    return res.rows[0] || null;
  }
};

export default TaxModel;
