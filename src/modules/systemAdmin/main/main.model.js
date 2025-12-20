import pool from '../../../loaders/db.loader.js';


export const fetchCompanyLogoByName = async (companyName) => {
  if (!companyName) throw new Error('Company name is required');

  try {
    const query = `
      SELECT company_logo_url
      FROM company_profiles
      WHERE company_name = $1;
    `;
    const { rows } = await pool.query(query, [companyName]);
    return rows[0]?.company_logo_url || null;
  } catch (error) {
    console.error('Error fetching company logo:', error);
    throw new Error('Failed to fetch company logo');
  }
};



export const upsertCompanyLogo = async (companyId, logoUrl) => {
  if (!companyId) throw new Error('Company ID is required');
  if (!logoUrl) throw new Error('Logo URL is required');

  try {
    const query = `
      INSERT INTO company_profiles (id, company_logo_url)
      VALUES ($1, $2)
      ON CONFLICT (id)
      DO UPDATE SET company_logo_url = EXCLUDED.company_logo_url
      RETURNING id, company_logo_url;
    `;
    const { rows } = await pool.query(query, [companyId, logoUrl]);
    return rows[0];
  } catch (error) {
    console.error('Error upserting company logo:', error);
    throw new Error('Failed to upsert company logo');
  }
};


export const fetchAllCompanyLogos = async (limit = 50) => {
  try {
    const query = `
      SELECT id, company_logo_url
      FROM company_profiles
      ORDER BY id ASC
      LIMIT $1;
    `;
    const { rows } = await pool.query(query, [limit]);
    return rows;
  } catch (error) {
    console.error('Error fetching all company logos:', error);
    throw new Error('Failed to fetch company logos');
  }
};

