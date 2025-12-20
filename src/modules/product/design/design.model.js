import pool from '../../../loaders/db.loader.js';

export const DesignModel = {
  async findAll(companyId) {
    const q = `SELECT * FROM designs WHERE company_id = $1 ORDER BY created_at DESC`;
    const { rows } = await pool.query(q, [companyId]);
    return rows;
  },

  async findById(companyId, designId) {
    const q = `SELECT * FROM designs WHERE company_id = $1 AND design_id = $2 LIMIT 1`;
    const { rows } = await pool.query(q, [companyId, designId]);
    return rows[0] || null;
  },

  async insert(companyId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // generate design_id using companies.next_design_number if available
      const nextRes = await client.query(
        `UPDATE companies SET next_design_number = (COALESCE(NULLIF(next_design_number, ''), '0')::bigint + 1)::text WHERE company_id = $1 RETURNING next_design_number`,
        [companyId]
      );
      let nextNum = Date.now();
      if (nextRes.rows[0] && nextRes.rows[0].next_design_number) {
        nextNum = parseInt(nextRes.rows[0].next_design_number, 10) || nextNum;
      }
      const design_id = `DSG-${String(nextNum).padStart(3, '0')}`;

      const insertQ = `
        INSERT INTO designs (
          company_id, design_id, design_name, description, status, tags, image_url, image_urls, metadata, created_by, created_at, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()
        ) RETURNING *
      `;

      const values = [
        companyId,
        design_id,
        data.design_name || data.name || null,
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
          description = $2,
          status = $3,
          tags = $4,
          image_url = $5,
          image_urls = $6,
          metadata = $7,
          updated_at = NOW()
        WHERE company_id = $8 AND design_id = $9
        RETURNING *
      `;

      const values = [
        data.design_name || data.name || null,
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
