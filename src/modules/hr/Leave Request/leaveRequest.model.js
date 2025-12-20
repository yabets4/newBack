import pool from '../../../loaders/db.loader.js';

export default class LeaveRequestModel {
  // --- Leave Requests ---
  async findAll(companyId, { employee_id, status, limit = 50, offset = 0 } = {}) {
    const clauses = ['company_id = $1'];
    const params = [companyId];
    let idx = 2;
    if (employee_id) {
      clauses.push(`employee_id = $${idx++}`);
      params.push(employee_id);
    }
    if (status) {
      clauses.push(`status = $${idx++}`);
      params.push(status);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const q = `SELECT * FROM leave_requests ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);
    const { rows } = await pool.query(q, params);
    return rows;
  }

  async findById(companyId, id) {
    const { rows } = await pool.query(
      `SELECT * FROM leave_requests WHERE company_id = $1 AND id = $2`,
      [companyId, id]
    );
    return rows[0] || null;
  }

  async findByEmployeeId(companyId, employeeId) {
    const { rows } = await pool.query(
      `SELECT * FROM leave_requests WHERE company_id = $1 AND employee_id = $2 ORDER BY created_at DESC`,
      [companyId, employeeId]
    );
    return rows;
  }

  async create(companyId, data) {
    const { employee_id, leave_type, start_date, end_date, reason, approver_comments, created_by } = data;

    const { rows } = await pool.query(
      `INSERT INTO leave_requests 
      (company_id, employee_id, leave_type, start_date, end_date, reason, approver_comments, created_by) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [companyId, employee_id, leave_type, start_date, end_date, reason || null, approver_comments || null, created_by || null]
    );

    return rows[0];
  }

  async update(companyId, id, data) {
    const allowed = ['employee_id', 'leave_type', 'start_date', 'end_date', 'reason', 'approver_comments', 'created_by', 'status'];
    const fields = [];
    const params = [companyId, id];
    let idx = 3;
    for (const k of allowed) {
      if (k in data) {
        fields.push(`${k} = $${idx++}`);
        params.push(data[k]);
      }
    }
    if (fields.length === 0) return null;
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const q = `UPDATE leave_requests SET ${fields.join(', ')} WHERE company_id = $1 AND id = $2 RETURNING *`;
    const { rows } = await pool.query(q, params);
    return rows[0] || null;
  }

  async delete(companyId, id) {
    const { rows } = await pool.query(
      `DELETE FROM leave_requests WHERE company_id = $1 AND id = $2 RETURNING *`,
      [companyId, id]
    );
    return rows[0] || null;
  }

  async approve(companyId, id, approver_comments) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Load the leave request to get details
      const { rows: reqRows } = await client.query(
        `SELECT * FROM leave_requests WHERE company_id = $1 AND id = $2 FOR UPDATE`,
        [companyId, id]
      );
      const lr = reqRows[0];
      if (!lr) {
        await client.query('ROLLBACK');
        return null;
      }

      if (lr.status === 'Approved') {
        // already approved
        await client.query('ROLLBACK');
        return lr;
      }

      // Determine leave_type_key if stored in balances table
      const normalizeKey = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const leaveKey = normalizeKey(lr.leave_type);

      // Fetch employee's leave balance row (lock it)
      const { rows: balRows } = await client.query(
        `SELECT * FROM employee_leave_balances WHERE company_id = $1 AND employee_id = $2 AND (leave_type_key = $3 OR leave_type = $4) FOR UPDATE`,
        [companyId, lr.employee_id, leaveKey, lr.leave_type]
      );
      const bal = balRows[0];

      if (!bal) {
        await client.query('ROLLBACK');
        throw new Error('No leave balance configured for this employee and leave type');
      }

      const requestedDays = Number(lr.number_of_days || 0);
      const remaining = Number(bal.remaining_days || 0);
      if (requestedDays > remaining) {
        await client.query('ROLLBACK');
        throw new Error(`Insufficient leave balance. Remaining: ${remaining}`);
      }

      // Update leave_requests status
      const { rows: updatedRows } = await client.query(
        `UPDATE leave_requests SET status='Approved', approver_comments=$1, updated_at=NOW() WHERE company_id = $2 AND id = $3 RETURNING *`,
        [approver_comments || null, companyId, id]
      );

      // Decrement remaining_days
      await client.query(
        `UPDATE employee_leave_balances SET remaining_days = remaining_days - $1, updated_at = NOW() WHERE id = $2`,
        [requestedDays, bal.id]
      );

      await client.query('COMMIT');
      return updatedRows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async reject(companyId, id, approver_comments) {
    const { rows } = await pool.query(
      `UPDATE leave_requests
       SET status='Rejected', approver_comments=$1, updated_at=NOW()
       WHERE company_id = $2 AND id=$3
       RETURNING *`,
      [approver_comments || null, companyId, id]
    );
    return rows[0] || null;
  }
}