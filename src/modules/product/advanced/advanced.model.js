import pool from '../../../loaders/db.loader.js';
import { v4 as uuidv4 } from 'uuid';

export const AdvancedModel = {
    // --- Nesting Jobs ---
    async createJob(companyId, data) {
        const { name, material_id, parts } = data;
        const job_id = `JOB-${uuidv4().slice(0, 8).toUpperCase()}`;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const insertJobQ = `
        INSERT INTO product_nesting_jobs (company_id, job_id, name, material_id)
        VALUES ($1, $2, $3, $4) RETURNING *;
      `;
            const { rows } = await client.query(insertJobQ, [companyId, job_id, name, material_id]);

            if (parts && parts.length > 0) {
                for (const part of parts) {
                    await client.query(
                        `INSERT INTO product_nesting_job_parts (company_id, job_id, part_id, quantity_to_nest)
             VALUES ($1, $2, $3, $4)`,
                        [companyId, job_id, part.partId, part.quantityToNest]
                    );
                }
            }

            await client.query('COMMIT');
            return { ...rows[0], parts };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    async findJobs(companyId) {
        const q = `
      SELECT j.*, 
             (SELECT json_agg(p) FROM product_nesting_job_parts p WHERE p.job_id = j.job_id AND p.company_id = j.company_id) as parts
      FROM product_nesting_jobs j
      WHERE j.company_id = $1
      ORDER BY j.created_at DESC;
    `;
        const { rows } = await pool.query(q, [companyId]);
        return rows;
    },

    async updateJobStatus(companyId, jobId, status) {
        const q = `
      UPDATE product_nesting_jobs 
      SET status = $3, updated_at = CURRENT_TIMESTAMP, last_optimized = CASE WHEN $3 = 'Completed' THEN CURRENT_TIMESTAMP ELSE last_optimized END
      WHERE company_id = $1 AND job_id = $2
      RETURNING *;
    `;
        const { rows } = await pool.query(q, [companyId, jobId, status]);
        return rows[0];
    },

    // --- Nesting Layouts ---
    async createLayout(companyId, data) {
        const { job_id, sheet_index, yield_percentage, waste_percentage, status, visual_parts } = data;
        const layout_id = `LAY-${uuidv4().slice(0, 8).toUpperCase()}`;

        const q = `
      INSERT INTO product_nesting_layouts (
        company_id, layout_id, job_id, sheet_index, yield_percentage, 
        waste_percentage, status, visual_parts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

        const { rows } = await pool.query(q, [
            companyId, layout_id, job_id, sheet_index, yield_percentage,
            waste_percentage, status || 'Draft', JSON.stringify(visual_parts || [])
        ]);
        return rows[0];
    },

    async findLayoutsByJob(companyId, jobId) {
        const q = `SELECT * FROM product_nesting_layouts WHERE company_id = $1 AND job_id = $2 ORDER BY sheet_index ASC;`;
        const { rows } = await pool.query(q, [companyId, jobId]);
        return rows;
    },

    async updateLayoutStatus(companyId, layoutId, status) {
        const q = `UPDATE product_nesting_layouts SET status = $3 WHERE company_id = $1 AND layout_id = $2 RETURNING *;`;
        const { rows } = await pool.query(q, [companyId, layoutId, status]);
        return rows[0];
    },

    // --- Offcuts ---
    async createOffcut(companyId, data) {
        const { material_id, width, height, unit, origin_job_id, area } = data;
        const offcut_id = `OFF-${uuidv4().slice(0, 8).toUpperCase()}`;

        const q = `
      INSERT INTO product_offcuts (
        company_id, offcut_id, material_id, width, height, unit, origin_job_id, area
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

        const { rows } = await pool.query(q, [
            companyId, offcut_id, material_id, width, height, unit, origin_job_id || null, area
        ]);
        return rows[0];
    },

    async findOffcuts(companyId, filters = {}) {
        const { materialId, status } = filters;
        const clauses = ['company_id = $1'];
        const params = [companyId];
        let idx = 2;

        if (materialId) {
            clauses.push(`material_id = $${idx++}`);
            params.push(materialId);
        }
        if (status) {
            clauses.push(`status = $${idx++}`);
            params.push(status);
        }

        const q = `SELECT * FROM product_offcuts WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC;`;
        const { rows } = await pool.query(q, params);
        return rows;
    },

    async updateOffcut(companyId, offcutId, data) {
        const fields = [];
        const params = [companyId, offcutId];
        let idx = 3;

        const allowed = ['status', 'reserved_for_job_id', 'consumed_by_job_id'];

        for (const key of allowed) {
            if (data[key] !== undefined) {
                fields.push(`${key} = $${idx++}`);
                params.push(data[key]);
            }
        }

        if (fields.length === 0) return null;

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        const q = `
      UPDATE product_offcuts 
      SET ${fields.join(', ')} 
      WHERE company_id = $1 AND offcut_id = $2 
      RETURNING *;
    `;

        const { rows } = await pool.query(q, params);
        return rows[0];
    },

    async deleteOffcut(companyId, offcutId) {
        const q = `DELETE FROM product_offcuts WHERE company_id = $1 AND offcut_id = $2;`;
        const { rowCount } = await pool.query(q, [companyId, offcutId]);
        return rowCount > 0;
    },

    // --- Nesting Reference Data ---
    async findNestingMaterials(companyId) {
        const q = `
            SELECT material_id as id, name, width, height, unit, cost_per_sq_unit as "costPerSqUnit"
            FROM product_nesting_materials
            WHERE company_id = $1
            ORDER BY name ASC;
        `;
        const { rows } = await pool.query(q, [companyId]);
        return rows;
    },

    async findNestingParts(companyId) {
        const q = `
            SELECT part_id as id, name, json_build_object('width', width, 'height', height) as dimensions, unit
            FROM product_nesting_parts
            WHERE company_id = $1
            ORDER BY name ASC;
        `;
        const { rows } = await pool.query(q, [companyId]);
        return rows;
    }
};
