import pool from '../../../loaders/db.loader.js';

export async function insertForecast(params, results) {
  const sql = `INSERT INTO sales_forecasts (params, results) VALUES ($1, $2) RETURNING id, timestamp`;
  const values = [params, results];
  const { rows } = await pool.query(sql, values);
  return rows[0];
}
