import pool from '../../../loaders/db.loader.js';

const AssignedToolModel = {
  async create(companyId, payload) {
    const res = await pool.query(
      `INSERT INTO assigned_tools
       (company_id, asset_id, asset_name, asset_type, employee_id, employee_name, assignment_date, return_date, status, notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING *`,
      [
        companyId,
        payload.asset_id || null,
        payload.asset_name || null,
        payload.asset_type || null,
        payload.employee_id || null,
        payload.employee_name || null,
        payload.assignment_date || null,
        payload.return_date || null,
        payload.status || 'assigned',
        payload.notes || null,
      ]
    );
    return res.rows[0] || null;
  },

  async update(companyId, id, payload) {
    const res = await pool.query(
      `UPDATE assigned_tools SET
         asset_id = $1, asset_name = $2, asset_type = $3, employee_id = $4, employee_name = $5,
         assignment_date = $6, return_date = $7, status = $8, notes = $9, updated_at = NOW()
       WHERE company_id = $10 AND id = $11 RETURNING *`,
      [
        payload.asset_id || null,
        payload.asset_name || null,
        payload.asset_type || null,
        payload.employee_id || null,
        payload.employee_name || null,
        payload.assignment_date || null,
        payload.return_date || null,
        payload.status || 'assigned',
        payload.notes || null,
        companyId,
        id,
      ]
    );
    return res.rows[0] || null;
  },

  async delete(companyId, id) {
    const res = await pool.query(`DELETE FROM assigned_tools WHERE company_id = $1 AND id = $2 RETURNING id`, [companyId, id]);
    return res.rows[0] || null;
  },

  async getById(companyId, id) {
    const res = await pool.query(`SELECT * FROM assigned_tools WHERE company_id = $1 AND id = $2 LIMIT 1`, [companyId, id]);
    return res.rows[0] || null;
  },

  async list(companyId, filters = {}) {
    // basic listing with optional employee filter
    let q = `SELECT * FROM assigned_tools WHERE company_id = $1`;
    const params = [companyId];
    if (filters.employee_id) {
      params.push(filters.employee_id);
      q += ` AND employee_id = $${params.length}`;
    }
    q += ` ORDER BY created_at DESC`;
    const res = await pool.query(q, params);
    return res.rows || [];
  }
};

export default AssignedToolModel;
