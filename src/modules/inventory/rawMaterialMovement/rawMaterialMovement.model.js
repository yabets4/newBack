// src/modules/inventory/rawMaterialMovement/rawMaterialMovement.model.js
import pool from '../../../loaders/db.loader.js';

export const RawMaterialMovementModel = {
  async findAll(companyId) {
    const result = await pool.query(
      `SELECT * FROM raw_material_movements 
       WHERE company_id = $1 
       ORDER BY movement_date DESC, created_at DESC`,
      [companyId]
    );
    return result.rows;
  },

  async findById(companyId, movementId) {
    const result = await pool.query(
      `SELECT * FROM raw_material_movements 
       WHERE company_id = $1 AND movement_id = $2`,
      [companyId, movementId]
    );
    return result.rows[0];
  },

  async findByRawMaterialId(companyId, rawMaterialId) {
    const result = await pool.query(
      `SELECT * FROM raw_material_movements 
       WHERE company_id = $1 AND raw_material_id = $2 
       ORDER BY movement_date DESC, created_at DESC`,
      [companyId, rawMaterialId]
    );
    return result.rows;
  },

  
  async getLookupData(companyId) {
    // Run queries in parallel for performance
    const rawMaterialsPromise = pool.query(
      `SELECT * FROM raw_materials WHERE company_id = $1 ORDER BY name ASC`,
      [companyId]
    );

    const suppliersPromise = pool.query(
      `SELECT * FROM suppliers WHERE company_id = $1 ORDER BY name ASC`,
      [companyId]
    );

    const locationsPromise = pool.query(
      `SELECT * FROM locations WHERE company_id = $1 ORDER BY name ASC`,
      [companyId]
    );

    const [rawMaterialsRes, suppliersRes, locationsRes] = await Promise.all([
      rawMaterialsPromise,
      suppliersPromise,
      locationsPromise
    ]);

    return {
      rawMaterials: rawMaterialsRes.rows,
      suppliers: suppliersRes.rows,
      locations: locationsRes.rows
    };
  },

  async create(companyId, data) {
    const {
      rawMaterialId,
      movementType,
      quantity,
      movementDate,
      sourceDocument,
      supplier,
      destinationDocument,
      departmentOrProject,
      fromLocation,
      toLocation,
      adjustmentType,
      adjustmentReason,
      notes,
      responsiblePerson
    } = data;

    const result = await pool.query(
      `INSERT INTO raw_material_movements (
        company_id, raw_material_id, movement_type, quantity, movement_date,
        source_document, supplier, destination_document, department_or_project,
        from_location, to_location, adjustment_type, adjustment_reason,
        notes, responsible_person
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        companyId,
        rawMaterialId,
        movementType,
        quantity,
        movementDate,
        sourceDocument || null,
        supplier || null,
        destinationDocument || null,
        departmentOrProject || null,
        fromLocation || null,
        toLocation || null,
        adjustmentType || null,
        adjustmentReason || null,
        notes || null,
        responsiblePerson || null
      ]
    );
    return result.rows[0];
  },

  async update(companyId, movementId, data) {
    const {
      rawMaterialId,
      movementType,
      quantity,
      movementDate,
      sourceDocument,
      supplier,
      destinationDocument,
      departmentOrProject,
      fromLocation,
      toLocation,
      adjustmentType,
      adjustmentReason,
      notes,
      responsiblePerson
    } = data;

    const result = await pool.query(
      `UPDATE raw_material_movements SET
        raw_material_id = $2,
        movement_type = $3,
        quantity = $4,
        movement_date = $5,
        source_document = $6,
        supplier = $7,
        destination_document = $8,
        department_or_project = $9,
        from_location = $10,
        to_location = $11,
        adjustment_type = $12,
        adjustment_reason = $13,
        notes = $14,
        responsible_person = $15
       WHERE company_id = $1 AND movement_id = $16
       RETURNING *`,
      [
        companyId,
        rawMaterialId,
        movementType,
        quantity,
        movementDate,
        sourceDocument || null,
        supplier || null,
        destinationDocument || null,
        departmentOrProject || null,
        fromLocation || null,
        toLocation || null,
        adjustmentType || null,
        adjustmentReason || null,
        notes || null,
        responsiblePerson || null,
        movementId
      ]
    );

    return result.rows[0];
  },

  async delete(companyId, movementId) {
    const result = await pool.query(
      `DELETE FROM raw_material_movements 
       WHERE company_id = $1 AND movement_id = $2
       RETURNING *`,
      [companyId, movementId]
    );
    return result.rows[0];
  }
};
