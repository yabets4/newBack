import pool from '../../../loaders/db.loader.js';

export const insertLog = async ({ level, message, context = {} }) => {
  const query = `
    INSERT INTO system_logs (level, message, context)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [level, message, context];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const fetchLogs = async (limit = 50) => {
  const query = `
    SELECT id, timestamp, level, message, context
    FROM system_logs
    ORDER BY timestamp DESC
    LIMIT $1;
  `;
  const { rows } = await pool.query(query, [limit]);
  return rows;
};
