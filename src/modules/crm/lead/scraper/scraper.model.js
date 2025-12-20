import pool from '../../../../loaders/db.loader.js';

export async function createScrape({ url, content, ai_summary, emails, phones }) {
  const query = `
    INSERT INTO scraped_data (url, content, ai_summary, emails, phones)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [url, content, ai_summary, emails, phones];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getScrapes() {
  const { rows } = await pool.query("SELECT * FROM scraped_data ORDER BY created_at DESC");
  return rows;
}

export async function getScrapeById(id) {
  const { rows } = await pool.query("SELECT * FROM scraped_data WHERE id = $1", [id]);
  return rows[0];
}

export async function updateScrape(id, { url, content, ai_summary, emails, phones }) {
  const query = `
    UPDATE scraped_data
    SET url = $1, content = $2, ai_summary = $3, emails = $4, phones = $5, updated_at = NOW()
    WHERE id = $6
    RETURNING *;
  `;
  const values = [url, content, ai_summary, emails, phones, id];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function deleteScrape(id) {
  const { rows } = await pool.query("DELETE FROM scraped_data WHERE id = $1 RETURNING *", [id]);
  return rows[0];
}
