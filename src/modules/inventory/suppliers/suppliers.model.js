import pool from '../../../loaders/db.loader.js';

export const SuppliersModel = {
  async findAll(companyId) {
    const res = await pool.query(
      `SELECT company_id, supplier_id, name, contact_person, email, phone, address, status, payment_terms, contact_info, latitude, longitude, notes
       FROM suppliers
       WHERE company_id = $1
       ORDER BY name ASC`,
      [companyId]
    );
    return res.rows;
  },

  async findById(companyId, supplierId) {
    const res = await pool.query(
      `SELECT company_id, supplier_id, name, contact_person, email, phone, address, status, payment_terms, contact_info, latitude, longitude, notes
       FROM suppliers
       WHERE company_id = $1 AND supplier_id = $2
       LIMIT 1`,
      [companyId, supplierId]
    );
    return res.rows[0];
  },

  async insert(companyId, data) {
    const supplierId = data.supplier_id || `SUP-${Date.now()}`;
    const res = await pool.query(
      `INSERT INTO suppliers (
         company_id, supplier_id, name, contact_person, email, phone, address, status, payment_terms, contact_info, latitude, longitude, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING company_id, supplier_id, name, latitude, longitude`,
      [
        companyId,
        supplierId,
        data.name,
        data.contact_person || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.status || 'active',
        data.payment_terms || null,
        data.contact_info || null,
        data.latitude || null,
        data.longitude || null,
        data.notes || null,
      ]
    );
    return res.rows[0];
  },

  async update(companyId, supplierId, data) {
    const res = await pool.query(
      `UPDATE suppliers SET
         name = $1,
         contact_person = $2,
         email = $3,
         phone = $4,
         address = $5,
         status = $6,
         payment_terms = $7,
         contact_info = $8,
         latitude = $9,
         longitude = $10,
         notes = $11
       WHERE company_id = $12 AND supplier_id = $13
       RETURNING *`,
      [
        data.name,
        data.contact_person || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.status || null,
        data.payment_terms || null,
        data.contact_info || null,
        data.latitude || null,
        data.longitude || null,
        data.notes || null,
        companyId,
        supplierId,
      ]
    );
    return res.rows[0];
  },

  async delete(companyId, supplierId) {
    const res = await pool.query(
      `DELETE FROM suppliers WHERE company_id = $1 AND supplier_id = $2`,
      [companyId, supplierId]
    );
    return res.rowCount > 0;
  }
};

export default SuppliersModel;
