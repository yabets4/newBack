import pool from '../../../loaders/db.loader.js';

const MaintenanceModel = {
  // Create a maintenance record
  create: async (data) => {
    const query = `
      INSERT INTO maintenance_records
        (company_id, maintenance_type, related_type, related_id, maintenance_date, description, cost, performed_by, notes, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      RETURNING *;
    `;
    const values = [
      data.company_id,
      data.maintenance_type,
      data.related_type,
      data.related_id,
      data.maintenance_date || null,
      data.description || null,
      data.cost != null ? data.cost : 0,
      data.performed_by || null,
      data.notes || null,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // Get a single maintenance record by id
  findById: async (company_id, id) => {
    const query = `SELECT * FROM maintenance_records WHERE company_id=$1 AND id=$2 LIMIT 1`;
    const { rows } = await pool.query(query, [company_id, id]);
    return rows[0];
  },

  // List maintenance records with optional filters
  findAll: async (company_id, filters = {}) => {
    const clauses = ['company_id = $1'];
    const params = [company_id];
    let idx = 2;

    if (filters.related_type) {
      clauses.push(`related_type = $${idx}`);
      params.push(filters.related_type);
      idx += 1;
    }
    if (filters.related_id) {
      clauses.push(`related_id = $${idx}`);
      params.push(filters.related_id);
      idx += 1;
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = filters.limit ? `LIMIT ${Number(filters.limit)}` : '';
    const offset = filters.offset ? `OFFSET ${Number(filters.offset)}` : '';

    const q = `SELECT * FROM maintenance_records ${where} ORDER BY maintenance_date DESC ${limit} ${offset}`;
    const { rows } = await pool.query(q, params);
    return rows;
  },

  // Delete maintenance record
  remove: async (company_id, id) => {
    const q = `DELETE FROM maintenance_records WHERE company_id=$1 AND id=$2 RETURNING *`;
    const { rows } = await pool.query(q, [company_id, id]);
    return rows[0];
  }
};

export default MaintenanceModel;
