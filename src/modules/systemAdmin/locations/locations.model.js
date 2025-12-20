import pool from '../../../loaders/db.loader.js';

export default class LocationsModel {
  constructor() {}

  async createLocation(companyId, locationData) {
    console.log(locationData);
    
    const { name, address, contact, operational_hours } = locationData;
    const res = await pool.query(
      `
      INSERT INTO locations
      (company_id, name, address, contact, operational_hours)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [companyId.toString(), name, address, contact, operational_hours]
    );
    return res.rows[0];
  }

  async getLocationsByCompany(companyId) {
    const res = await pool.query(
      `SELECT * FROM locations WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    );
    return res.rows;
  }

  async getLocationById(locationId) {
    const res = await pool.query(
      `SELECT * FROM locations WHERE id = $1`,
      [locationId]
    );
    return res.rows[0];
  }
}
