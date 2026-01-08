import pool from '../../../loaders/db.loader.js';

export const BOMModel = {
  async findAll(companyId, productId = null) {
    let q = `
      SELECT b.*, p.product_name as "productName", p.sku as "productSku"
      FROM boms b
      LEFT JOIN products p ON b.company_id = p.company_id AND b.product_id = p.product_id
      WHERE b.company_id = $1
    `;
    const params = [companyId];
    if (productId) {
      q += ` AND b.product_id = $2`;
      params.push(productId);
    }
    q += ` ORDER BY b.last_modified_date DESC`;
    const { rows } = await pool.query(q, params);
    return rows;
  },

  async findById(companyId, bomId) {
    const q = `
      SELECT b.*, p.product_name as "productName", p.sku as "productSku"
      FROM boms b
      LEFT JOIN products p ON b.company_id = p.company_id AND b.product_id = p.product_id
      WHERE b.company_id = $1 AND b.bom_id = $2
      LIMIT 1
    `;
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
          company_id, bom_id, name, product_code, product_id, version, status, components, estimated_cost,
          component_count, created_by, approved_by, creation_date, last_modified_date, tags
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
        ) RETURNING *
      `;

      const values = [
        companyId,
        bom_id,
        data.name,
        data.productCode || data.product_code || null,
        data.productId || data.product_id || null,
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
          (c.name || c.component_name || c.material_name || c.raw_material_name || c.rawMaterialName) || null,
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
          product_id = $3,
          version = $4,
          status = $5,
          components = $6,
          estimated_cost = $7,
          component_count = $8,
          approved_by = $9,
          last_modified_date = $10,
          tags = $11
        WHERE company_id = $12 AND bom_id = $13
        RETURNING *
      `;

      const values = [
        data.name || null,
        data.productCode || data.product_code || null,
        data.productId || data.product_id || null, // Handle product_id update
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
          (c.name || c.component_name || c.material_name || c.raw_material_name || c.rawMaterialName) || null,
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
  },

  // --- Dynamic BOM Rules CRUD ---
  async findRules(companyId, productId) {
    const vals = [companyId];
    let q = `SELECT * FROM dynamic_bom_rules WHERE company_id = $1`;
    if (productId) {
      q += ` AND product_id = $2`;
      vals.push(productId);
    }
    q += ` ORDER BY priority ASC, updated_at DESC`;
    const { rows } = await pool.query(q, vals);
    return (rows || []).map(r => ({
      id: r.rule_id,
      productId: r.product_id,
      name: r.name,
      description: r.description,
      priority: r.priority,
      status: r.status,
      conditions: r.conditions || [],
      actions: r.actions || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async findRuleById(companyId, ruleId) {
    const q = `SELECT * FROM dynamic_bom_rules WHERE company_id = $1 AND rule_id = $2 LIMIT 1`;
    const { rows } = await pool.query(q, [companyId, ruleId]);
    const r = rows[0] || null;
    if (!r) return null;
    return {
      id: r.rule_id,
      productId: r.product_id,
      name: r.name,
      description: r.description,
      priority: r.priority,
      status: r.status,
      conditions: r.conditions || [],
      actions: r.actions || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async insertRule(companyId, data) {
    const q = `
      INSERT INTO dynamic_bom_rules (company_id, rule_id, product_id, name, description, priority, status, conditions, actions, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING *
    `;
    const values = [
      companyId,
      data.id || data.rule_id || `RULE-${Date.now()}`,
      data.productId,
      data.name || null,
      data.description || null,
      data.priority != null ? data.priority : 100,
      data.status || 'Active',
      JSON.stringify(data.conditions || []),
      JSON.stringify(data.actions || []),
    ];
    const { rows } = await pool.query(q, values);
    const r = rows[0];
    return {
      id: r.rule_id,
      productId: r.product_id,
      name: r.name,
      description: r.description,
      priority: r.priority,
      status: r.status,
      conditions: r.conditions || [],
      actions: r.actions || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async updateRule(companyId, ruleId, data) {
    const q = `
      UPDATE dynamic_bom_rules SET
        name = $1,
        description = $2,
        priority = $3,
        status = $4,
        conditions = $5,
        actions = $6,
        updated_at = NOW()
      WHERE company_id = $7 AND rule_id = $8
      RETURNING *
    `;
    const values = [
      data.name || null,
      data.description || null,
      data.priority != null ? data.priority : 100,
      data.status || 'Active',
      JSON.stringify(data.conditions || []),
      JSON.stringify(data.actions || []),
      companyId,
      ruleId,
    ];
    const { rows } = await pool.query(q, values);
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.rule_id,
      productId: r.product_id,
      name: r.name,
      description: r.description,
      priority: r.priority,
      status: r.status,
      conditions: r.conditions || [],
      actions: r.actions || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async deleteRule(companyId, ruleId) {
    const res = await pool.query(`DELETE FROM dynamic_bom_rules WHERE company_id = $1 AND rule_id = $2`, [companyId, ruleId]);
    return res.rowCount > 0;
  },
};
