import pool from '../../../loaders/db.loader.js';

/**
 * Model for persistent sales forecasting results.
 */
export async function insertForecast(companyId, params, results) {
  const sql = `
    INSERT INTO sales_forecasts (company_id, params, results) 
    VALUES ($1, $2, $3) 
    RETURNING id, timestamp
  `;
  const values = [companyId, params, results];
  const { rows } = await pool.query(sql, values);
  return rows[0];
}

/**
 * Retrieves the most recent forecast for comparison/audit.
 */
export async function getLatestForecast(companyId) {
  const sql = `
    SELECT * FROM sales_forecasts 
    WHERE company_id = $1 
    ORDER BY timestamp DESC 
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [companyId]);
  return rows[0] || null;
}
