import pool from '../../../loaders/db.loader.js';

export default class ShiftModel {
  // Find shifts for a company. opts: { employee_id, start_date, end_date, limit, offset }
  async findAll(companyId, opts = {}) {
    const { employee_id, start_date, end_date, limit = 100, offset = 0 } = opts;
    const clauses = ['company_id = $1'];
    const params = [companyId];
    let idx = 2;
    if (employee_id) {
      clauses.push(`employee_id = $${idx++}`);
      params.push(employee_id);
    }
    if (start_date) {
      clauses.push(`shift_date >= $${idx++}`);
      params.push(start_date);
    }
    if (end_date) {
      clauses.push(`shift_date <= $${idx++}`);
      params.push(end_date);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const q = `SELECT * FROM shift ${where} ORDER BY shift_date ASC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit);
    params.push(offset);
    const { rows } = await pool.query(q, params);
    return rows;
  }

  async findById(companyId, shiftId) {
    const { rows } = await pool.query(
      `SELECT * FROM shift WHERE company_id = $1 AND (shift_id = $2 OR id::text = $2)`,
      [companyId, shiftId]
    );
    return rows[0] || null;
  }

  async findByEmployeeId(companyId, employeeId) {
    const { rows } = await pool.query(
      `SELECT * FROM shift WHERE company_id = $1 AND employee_id = $2 ORDER BY shift_date ASC`,
      [companyId, employeeId]
    );
    return rows;
  }

  async create(companyId, data) {
    const { shift_id, employee_id, employee_name, shift_date, start_time, end_time, type, location_name, notes } = data;

    // generate shift_id if not provided
    let sid = shift_id;
    if (!sid) {
      sid = `SHIFT-${Date.now() % 1000000}-${Math.floor(Math.random() * 1000)}`;
    }

    const { rows } = await pool.query(
      `INSERT INTO shift (company_id, shift_id, employee_id, employee_name, shift_date, start_time, end_time, type, location_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [companyId, sid, employee_id, employee_name || null, shift_date, start_time || null, end_time || null, type || null, location_name || null, notes || null]
    );
    return rows[0];
  }

  async update(companyId, shiftId, data) {
    // Build dynamic set clause
    const allowed = ['employee_id', 'employee_name', 'shift_date', 'start_time', 'end_time', 'type', 'location_name', 'notes'];
    const fields = [];
    const params = [companyId, shiftId];
    let idx = 3;
    for (const k of allowed) {
      if (k in data) {
        fields.push(`${k} = $${idx++}`);
        params.push(data[k]);
      }
    }
    if (fields.length === 0) return null;
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const q = `UPDATE shift SET ${fields.join(', ')} WHERE company_id = $1 AND (shift_id = $2 OR id::text = $2) RETURNING *`;
    const { rows } = await pool.query(q, params);
    return rows[0] || null;
  }

  async delete(companyId, shiftId) {
    const { rows } = await pool.query(
      `DELETE FROM shift WHERE company_id = $1 AND (shift_id = $2 OR id::text = $2) RETURNING *`,
      [companyId, shiftId]
    );
    return rows[0] || null;
  }
}
