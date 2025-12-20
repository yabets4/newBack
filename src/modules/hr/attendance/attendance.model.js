import pool from '../../../loaders/db.loader.js';

export const AttendanceModel = {
  async create(companyId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // If frontend provided an attendance_id prefix, use it; otherwise generate using companies.next_attendance_number
      let attendance_id = data.attendance_id;
      if (!attendance_id) {
        const { rows } = await client.query(
          `UPDATE companies SET next_attendance_number = COALESCE(next_attendance_number, 0) + 1 WHERE company_id = $1 RETURNING next_attendance_number`,
          [companyId]
        );
        const num = rows[0].next_attendance_number;
        attendance_id = `ATT-${String(num).padStart(6, '0')}`;
      }

      await client.query(
        `INSERT INTO attendance_logs (
          company_id, attendance_id, employee_id, event_date,
          clock_in_time, clock_out_time, break_start_time, break_end_time,
          total_hours, status, notes, location
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          companyId,
          attendance_id,
          data.employee_id,
          data.event_date,
          data.clock_in_time || null,
          data.clock_out_time || null,
          data.break_start_time || null,
          data.break_end_time || null,
          data.total_hours || 0,
          data.status || null,
          data.notes || null,
          data.location || null
        ]
      );

      await client.query('COMMIT');
      return { attendance_id, ...data };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('AttendanceModel.create error', err);
      throw err;
    } finally {
      client.release();
    }
  },

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
      clauses.push(`event_date >= $${idx++}`);
      params.push(start_date);
    }
    if (end_date) {
      clauses.push(`event_date <= $${idx++}`);
      params.push(end_date);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const q = `SELECT * FROM attendance_logs ${where} ORDER BY event_date DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit);
    params.push(offset);
    const { rows } = await pool.query(q, params);
    return rows;
  },

  async findById(companyId, attendanceId) {
    const { rows } = await pool.query(
      `SELECT * FROM attendance_logs WHERE company_id = $1 AND attendance_id = $2`,
      [companyId, attendanceId]
    );
    return rows[0] || null;
  },

  async findByEmployeeAndDate(companyId, employeeId, date) {
    const { rows } = await pool.query(
      `SELECT * FROM attendance_logs WHERE company_id = $1 AND employee_id = $2 AND event_date = $3`,
      [companyId, employeeId, date]
    );
    return rows;
  },

  async bulkInsert(companyId, records = []) {
    if (!Array.isArray(records) || records.length === 0) return { inserted: 0 };
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let inserted = 0;
      for (const rec of records) {
        // ensure attendance_id
        let attendance_id = rec.attendance_id;
        if (!attendance_id) {
          const { rows } = await client.query(
            `UPDATE companies SET next_attendance_number = COALESCE(next_attendance_number, 0) + 1 WHERE company_id = $1 RETURNING next_attendance_number`,
            [companyId]
          );
          const num = rows[0].next_attendance_number;
          attendance_id = `ATT-${String(num).padStart(6, '0')}`;
        }

        await client.query(
          `INSERT INTO attendance_logs (
            company_id, attendance_id, employee_id, event_date,
            clock_in_time, clock_out_time, break_start_time, break_end_time,
            total_hours, status, notes, location
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          ON CONFLICT (company_id, attendance_id) DO NOTHING`,
          [
            companyId,
            attendance_id,
            rec.employee_id,
            rec.event_date,
            rec.clock_in_time || null,
            rec.clock_out_time || null,
            rec.break_start_time || null,
            rec.break_end_time || null,
            rec.total_hours || 0,
            rec.status || null,
            rec.notes || null,
            rec.location || null
          ]
        );
        inserted += 1;
      }
      await client.query('COMMIT');
      return { inserted };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('AttendanceModel.bulkInsert error', err);
      throw err;
    } finally {
      client.release();
    }
  },

  async update(companyId, attendanceId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Build dynamic set clause
      const fields = [];
      const params = [companyId, attendanceId];
      let idx = 3;
      const allowed = ['employee_id','event_date','clock_in_time','clock_out_time','break_start_time','break_end_time','total_hours','status','notes','location'];
      for (const k of allowed) {
        if (k in data) {
          fields.push(`${k} = $${idx++}`);
          params.push(data[k]);
        }
      }
      if (fields.length === 0) return null;

      // updated_at
      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      const q = `UPDATE attendance_logs SET ${fields.join(', ')} WHERE company_id = $1 AND attendance_id = $2 RETURNING *`;
      const { rows } = await client.query(q, params);
      await client.query('COMMIT');
      return rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('AttendanceModel.update error', err);
      throw err;
    } finally {
      client.release();
    }
  },

  async remove(companyId, attendanceId) {
    const { rowCount } = await pool.query(
      `DELETE FROM attendance_logs WHERE company_id = $1 AND attendance_id = $2`,
      [companyId, attendanceId]
    );
    return rowCount > 0;
  }
};

