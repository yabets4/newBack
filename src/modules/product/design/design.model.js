import pool from '../../../loaders/db.loader.js';

export const DesignModel = {
  async findAll(companyId, productId = null) {
    let q = `
      SELECT d.*, p.product_name as "productName", p.sku as "productSku"
      FROM designs d
      LEFT JOIN products p ON d.company_id = p.company_id AND d.product_id = p.product_id
      WHERE d.company_id = $1
    `;
    const params = [companyId];
    if (productId) {
      q += ` AND d.product_id = $2`;
      params.push(productId);
    }
    q += ` ORDER BY d.created_at DESC`;
    const { rows } = await pool.query(q, params);
    return rows;
  },

  async findById(companyId, designId) {
    const q = `
      SELECT d.*, p.product_name as "productName", p.sku as "productSku"
      FROM designs d
      LEFT JOIN products p ON d.company_id = p.company_id AND d.product_id = p.product_id
      WHERE d.company_id = $1 AND d.design_id = $2
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [companyId, designId]);
    return rows[0] || null;
  },

  async insert(companyId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // generate a simple random design_id
      const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const design_id = `DSG-${uniq}`;

      const insertQ = `
        INSERT INTO designs (
          company_id, design_id, design_name, product_id, description, status, tags, image_url, image_urls, metadata, created_by, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW()
        ) RETURNING *
      `;

      const values = [
        companyId,
        design_id,
        data.design_name || data.name || null,
        data.productId || data.product_id || null,
        data.description || null,
        data.status || 'Active',
        data.tags || null,
        data.image_url || null,
        data.image_urls || null,
        data.metadata || null,
        data.created_by || null
      ];

      const { rows } = await client.query(insertQ, values);
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(companyId, designId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const q = `
        UPDATE designs SET
          design_name = $1,
          product_id = $2,
          description = $3,
          status = $4,
          tags = $5,
          image_url = $6,
          image_urls = $7,
          metadata = $8,
          updated_at = NOW()
        WHERE company_id = $9 AND design_id = $10
        RETURNING *
      `;

      const values = [
        data.design_name || data.name || null,
        data.productId || data.product_id || null,
        data.description || null,
        data.status || null,
        data.tags || null,
        data.image_url || null,
        data.image_urls || null,
        data.metadata || null,
        companyId,
        designId
      ];

      const { rows } = await client.query(q, values);
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatusWithNote(companyId, designId, newStatus, noteObj) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const q = `
        UPDATE designs SET
          status = $1,
          reviewer_notes = COALESCE(reviewer_notes, '[]'::jsonb) || $2::jsonb,
          updated_at = NOW()
        WHERE company_id = $3 AND design_id = $4
        RETURNING *
      `;

      // wrap the note object in an array so jsonb array concat works
      const noteArrayJson = JSON.stringify([noteObj || {}]);
      const values = [newStatus, noteArrayJson, companyId, designId];

      const { rows } = await client.query(q, values);
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async delete(companyId, designId) {
    const res = await pool.query(`DELETE FROM designs WHERE company_id = $1 AND design_id = $2`, [companyId, designId]);
    return res.rowCount > 0;
  }
};

export default DesignModel;
