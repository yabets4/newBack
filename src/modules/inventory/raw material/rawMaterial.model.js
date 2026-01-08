// src/modules/inventory/rawMaterials/rawMaterials.model.js
import pool from '../../../loaders/db.loader.js';

export const RawMaterialsModel = {
  async findAll(companyId) {
    const result = await pool.query(
      `
      SELECT 
        rm.company_id,
        rm.raw_material_id,
        rm.name,
        rm.location,
        rm.category_id,
        rm.current_stock,
        rm.uom,
        rm.cost_price,
        rm.minimum_stock,
        rm.shelf_life,
        rm.supplier_id,
        rm.created_at,
        rmp.description,
        rmp.specifications,
        rmp.image_url,
        rmp.updated_at
      FROM raw_materials rm
      LEFT JOIN raw_materials_profile rmp 
        ON rm.company_id = rmp.company_id AND rm.raw_material_id = rmp.raw_material_id
      WHERE rm.company_id = $1
      ORDER BY rm.created_at DESC
      `,
      [companyId]
    );
    return result.rows;
  },
  async findAllLocation(companyId) {
  // --- Fetch locations ---
  const locationsResult = await pool.query(
    `
    SELECT 
      l.id,

      l.name,
      l.address,
      l.contact,
      l.operational_hours,
      l.created_at,
      l.updated_at
    FROM locations l
    WHERE l.company_id = $1
    ORDER BY l.created_at DESC
    `,
    [companyId]
  );
  
  // --- Fetch categories ---
  const categoriesResult = await pool.query(
    `
    SELECT 
      c.category_id,
      c.name
    FROM categories c
    WHERE c.company_id = $1
    ORDER BY c.name ASC
    `,
    [companyId]
  );

  // --- Fetch suppliers ---
  const suppliersResult = await pool.query(
    `
    SELECT 
      s.supplier_id,
      s.name,
      s.contact_info
    FROM suppliers s
    WHERE s.company_id = $1
    ORDER BY s.name ASC
    `,
    [companyId]
  );

  const UmosResult = await pool.query(
    `
    SELECT  * FROM units_of_measure WHERE company_id=$1 ORDER BY name ASC`, [companyId]);
    
  return {
    locations: locationsResult.rows,
    categories: categoriesResult.rows,
    suppliers: suppliersResult.rows,
    uoms: UmosResult.rows
  };
},



  async findById(companyId, rawMaterialId) {
    // Fetch raw material details
    const rmResult = await pool.query(
      `
      SELECT 
        rm.company_id,
        rm.raw_material_id,
          rm.location,
        rm.current_stock,
        rm.name,
        rm.category_id,
        rm.uom,
        rm.cost_price,
        rm.minimum_stock,
        rm.shelf_life,
        rm.supplier_id,
        rm.created_at,
        rmp.description,
        rmp.specifications,
        rmp.image_url,
        rmp.updated_at
      FROM raw_materials rm
      LEFT JOIN raw_materials_profile rmp 
        ON rm.company_id = rmp.company_id AND rm.raw_material_id = rmp.raw_material_id
      WHERE rm.company_id = $1 AND rm.raw_material_id = $2
      LIMIT 1
      `,
      [companyId, rawMaterialId]
    );

    const rawMaterial = rmResult.rows[0];
    if (!rawMaterial) return null;

    // Fetch movement history
    const mvResult = await pool.query(
      `
      SELECT 
        movement_id,
        movement_type,
        quantity,
        movement_date,
        source_document,
        supplier,
        destination_document,
        department_or_project,
        from_location,
        to_location,
        adjustment_type,
        adjustment_reason,
        notes,
        responsible_person,
        created_at
      FROM raw_material_movements
      WHERE company_id = $1 AND raw_material_id = $2
      ORDER BY movement_date DESC, created_at DESC
      `,
      [companyId, rawMaterialId]
    );

    rawMaterial.movements = mvResult.rows; // append movements

    return rawMaterial;
  },


  async insert(companyId, data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Generate raw_material_id
      const nextNumRes = await client.query(
        `UPDATE companies
         SET next_raw_material_number = next_raw_material_number + 1
         WHERE company_id = $1
         RETURNING next_raw_material_number`,
        [companyId]
      );
      const nextNum = nextNumRes.rows[0].next_raw_material_number;
      const raw_material_id = `RM-${String(nextNum).padStart(3, "0")}`;

      // Insert into raw_materials
      const rmRes = await client.query(
        `INSERT INTO raw_materials (
          company_id, raw_material_id, name, category_id, uom,
            cost_price, minimum_stock, shelf_life, supplier_id, location, current_stock
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING company_id, raw_material_id`,
        [
          companyId,
          raw_material_id,
          data.name,
          data.category_id,
          data.uom,
          data.cost_price,
          data.minimum_stock,
            data.shelf_life || null,
            data.supplier_id,
            data.location || null,
          data.current_stock || 0
        ]
      );
      const rawMaterial = rmRes.rows[0];

      // Insert profile (note: profile table stores description/specs/image_url)
      const profileRes = await client.query(
        `INSERT INTO raw_materials_profile (
          company_id, raw_material_id, description, specifications, image_url
        ) VALUES ($1,$2,$3,$4,$5)
        RETURNING *`,
        [
          companyId,
          rawMaterial.raw_material_id,
          data.description || null,
          data.specifications || null,
          data.image_url || null
        ]
      );

      await client.query("COMMIT");
      return { ...rawMaterial, profile: profileRes.rows[0] };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async update(companyId, rawMaterialId, data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update raw_materials
      await client.query(
        `UPDATE raw_materials SET
          name = $1,
          category_id = $2,
          uom = $3,
          cost_price = $4,
          minimum_stock = $5,
          shelf_life = $6,
          supplier_id = $7,
          location = $8
        WHERE company_id = $9 AND raw_material_id = $10`,
        [
          data.name,
          data.category_id,
          data.uom,
          data.cost_price,
          data.minimum_stock,
          data.shelf_life,
          data.supplier_id,
          data.location || null,
          companyId,
          rawMaterialId
        ]
      );

      // Update profile
      const profileRes = await client.query(
        `UPDATE raw_materials_profile SET
          description = $1,
          specifications = $2,
          image_url = $3,
          updated_at = NOW()
        WHERE company_id = $4 AND raw_material_id = $5
        RETURNING *`,
        [
          data.description || null,
          data.specifications || null,
          data.image_url || null,
          companyId,
          rawMaterialId
        ]
      );

      await client.query("COMMIT");
      return profileRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async delete(companyId, rawMaterialId) {
    const res = await pool.query(
      `DELETE FROM raw_materials WHERE company_id = $1 AND raw_material_id = $2`,
      [companyId, rawMaterialId]
    );
    return res.rowCount > 0;
  }
};
