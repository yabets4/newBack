import pool from '../../../loaders/db.loader.js';

export const BOMModel = {
  async findAll(companyId) {
    const q = `SELECT * FROM boms WHERE company_id = $1 ORDER BY last_modified_date DESC`;
    const { rows } = await pool.query(q, [companyId]);
    return rows;
  },

  async findById(companyId, bomId) {
    const q = `SELECT * FROM boms WHERE company_id = $1 AND bom_id = $2 LIMIT 1`;
    const { rows } = await pool.query(q, [companyId, bomId]);
    const bom = rows[0] || null;
    if (!bom) return null;

    // fetch components from bom_components table
    const compQ = `SELECT component_id, name, quantity, unit, manufacturer, part_number, cost, meta FROM bom_components WHERE company_id = $1 AND bom_id = $2 ORDER BY component_id`;
    const compRes = await pool.query(compQ, [companyId, bomId]);
    const components = (compRes.rows || []).map(c => ({
      id: c.component_id,
      name: c.name,
      quantity: Number(c.quantity),
      unit: c.unit,
      manufacturer: c.manufacturer,
      partNumber: c.part_number,
      cost: c.cost === null ? 0 : Number(c.cost),
      meta: c.meta || {}
    }));

    return { ...bom, components };
  },

  async insert(companyId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const bom_id = data.id || data.bom_id || `BOM-${Date.now()}`;

      const q = `
        INSERT INTO boms (
          company_id, bom_id, name, product_code, version, status, components, estimated_cost,
          component_count, created_by, approved_by, creation_date, last_modified_date, tags
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
        ) RETURNING *
      `;

      const values = [
        companyId,
        bom_id,
        data.name,
        data.productCode || data.product_code || null,
        data.version || null,
        data.status || 'Draft',
        JSON.stringify(data.components || []),
        data.estimated_cost || 0,
        data.component_count || (Array.isArray(data.components) ? data.components.length : 0),
        data.created_by || null,
        data.approved_by || null,
        data.creation_date || new Date().toISOString(),
        data.last_modified_date || new Date().toISOString(),
        JSON.stringify(data.tags || [])
      ];

      const { rows } = await client.query(q, values);

      // insert components into bom_components table if present
      const comps = Array.isArray(data.components) ? data.components : [];
      for (let i = 0; i < comps.length; i++) {
        const c = comps[i] || {};
        const component_id = c.id || `C-${Date.now()}-${i}`;
        const insertCompQ = `
          INSERT INTO bom_components (company_id, bom_id, component_id, name, quantity, unit, manufacturer, part_number, cost, meta)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `;
        const compValues = [
          companyId,
          bom_id,
          component_id,
          c.name || null,
          c.quantity != null ? c.quantity : 1,
          c.unit || null,
          c.manufacturer || null,
          c.partNumber || c.part_number || null,
          c.cost != null ? c.cost : 0,
          c.meta || {}
        ];
        await client.query(insertCompQ, compValues);
      }

      await client.query('COMMIT');
      // attach components for return
      const created = rows[0];
      created.components = comps;
      return created;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(companyId, bomId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const q = `
        UPDATE boms SET
          name = $1,
          product_code = $2,
          version = $3,
          status = $4,
          components = $5,
          estimated_cost = $6,
          component_count = $7,
          approved_by = $8,
          last_modified_date = $9,
          tags = $10
        WHERE company_id = $11 AND bom_id = $12
        RETURNING *
      `;

      const values = [
        data.name || null,
        data.productCode || data.product_code || null,
        data.version || null,
        data.status || null,
        JSON.stringify(data.components || []),
        data.estimated_cost || 0,
        data.component_count || (Array.isArray(data.components) ? data.components.length : 0),
        data.approved_by || null,
        data.last_modified_date || new Date().toISOString(),
        JSON.stringify(data.tags || []),
        companyId,
        bomId
      ];

      const { rows } = await client.query(q, values);
      const updated = rows[0];

      // Replace components in bom_components table: delete existing and insert new ones
      await client.query(`DELETE FROM bom_components WHERE company_id = $1 AND bom_id = $2`, [companyId, bomId]);
      const comps = Array.isArray(data.components) ? data.components : [];
      for (let i = 0; i < comps.length; i++) {
        const c = comps[i] || {};
        const component_id = c.id || `C-${Date.now()}-${i}`;
        const insertCompQ = `
          INSERT INTO bom_components (company_id, bom_id, component_id, name, quantity, unit, manufacturer, part_number, cost, meta)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `;
        const compValues = [
          companyId,
          bomId,
          component_id,
          c.name || null,
          c.quantity != null ? c.quantity : 1,
          c.unit || null,
          c.manufacturer || null,
          c.partNumber || c.part_number || null,
          c.cost != null ? c.cost : 0,
          c.meta || {}
        ];
        await client.query(insertCompQ, compValues);
      }

      await client.query('COMMIT');
      updated.components = comps;
      return updated;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async delete(companyId, bomId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM bom_components WHERE company_id = $1 AND bom_id = $2`, [companyId, bomId]);
      const res = await client.query(`DELETE FROM boms WHERE company_id = $1 AND bom_id = $2`, [companyId, bomId]);
      await client.query('COMMIT');
      return res.rowCount > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};
