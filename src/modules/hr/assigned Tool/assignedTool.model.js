import pool from '../../../loaders/db.loader.js';
import { tableName } from '../../../utils/prefix.utils.js';

export default class AssignedToolModel {
  // --- Get all assigned tools ---
  async findAll(prefix, { limit = 50, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM ${tableName('assigned_tools', prefix)} ORDER BY id ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  }

  // --- Get assigned tool by ID ---
  async findById(prefix, id) {
    const toolsTable = tableName('assigned_tools', prefix);
    const { rows } = await pool.query(
      `SELECT * FROM ${toolsTable} WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  // --- Create new assigned tool record ---
  async create(prefix, data) {
    const toolsTable = tableName('assigned_tools', prefix);

    const { employee_id, asset_name, assignment_date, return_date, status, notes } = data;

    const { rows } = await pool.query(
      `INSERT INTO ${toolsTable} 
      (employee_id, asset_name, assignment_date, return_date, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [employee_id, asset_name, assignment_date, return_date || null, status || 'Assigned', notes || null]
    );

    return rows[0];
  }

  // --- Update assigned tool record ---
  async update(prefix, id, data) {
    const toolsTable = tableName('assigned_tools', prefix);

    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    if (!fields.length) return null;

    values.push(id);

    const { rows } = await pool.query(
      `UPDATE ${toolsTable}
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING *`,
      values
    );

    return rows[0] || null;
  }

  // --- Delete assigned tool record ---
  async delete(prefix, id) {
    const toolsTable = tableName('assigned_tools', prefix);
    const { rowCount } = await pool.query(
      `DELETE FROM ${toolsTable} WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }
}
