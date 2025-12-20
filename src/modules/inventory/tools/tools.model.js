import pool from '../../../loaders/db.loader.js';

const ToolsModel = {

    // Create new tool/machine
    create: async (data) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get and increment the next tool number
            const numberRes = await client.query(
                'SELECT next_tool_assignment_number FROM companies WHERE company_id = $1 FOR UPDATE',
                [data.company_id]
            );
            const toolNumber = numberRes.rows[0].next_tool_assignment_number;
            const asset_id = `tool-${String(toolNumber).padStart(3, '0')}`;

            await client.query(
                'UPDATE companies SET next_tool_assignment_number = $1 WHERE company_id = $2',
                [toolNumber + 1, data.company_id]
            );

            const {
                company_id, name, type, serial_number, manufacturer, model_number,
                purchase_date, cost, status, location, last_maintenance_date, next_maintenance_date,
                assigned_to, notes, image_url
            } = data;

            const query = `
                INSERT INTO tools_machinery (
                    company_id, asset_id, name, type, serial_number, manufacturer, model_number,
                    purchase_date, cost, status, location, last_maintenance_date, next_maintenance_date,
                    assigned_to, notes, image_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *;
            `;
            const values = [
                company_id, asset_id, name, type, serial_number, manufacturer, model_number,
                purchase_date, cost, status, location, last_maintenance_date, next_maintenance_date,
                assigned_to, notes, image_url
            ];
            const { rows } = await client.query(query, values);
            
            await client.query('COMMIT');
            return rows[0];
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    // Get all tools/machinery for a company
    findAll: async (company_id) => {
        const query = `SELECT * FROM tools_machinery WHERE company_id = $1 ORDER BY created_at DESC`;
        const { rows } = await pool.query(query, [company_id]);
        return rows;
    },

    // Get single tool/machine by ID
    findById: async (company_id, id) => {
        const query = `SELECT * FROM tools_machinery WHERE company_id = $1 AND id = $2`;
        const { rows } = await pool.query(query, [company_id, id]);
        return rows[0];
    },

    // Update tool/machine
    update: async (company_id, id, data) => {
        const {
            asset_id, name, type, serial_number, manufacturer, model_number,
            purchase_date, cost, status, location, last_maintenance_date, next_maintenance_date,
            assigned_to, notes, image_url
        } = data;

        const query = `
            UPDATE tools_machinery SET
                asset_id = $1, name = $2, type = $3, serial_number = $4, manufacturer = $5, model_number = $6,
                purchase_date = $7, cost = $8, status = $9, location = $10, last_maintenance_date = $11,
                next_maintenance_date = $12, assigned_to = $13, notes = $14, image_url = $15, updated_at = NOW()
            WHERE company_id = $16 AND id = $17
            RETURNING *;
        `;
        const values = [
            asset_id, name, type, serial_number, manufacturer, model_number,
            purchase_date, cost, status, location, last_maintenance_date, next_maintenance_date,
            assigned_to, notes, image_url, company_id, id
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    // Delete tool/machine
    remove: async (company_id, id) => {
        const query = `DELETE FROM tools_machinery WHERE company_id = $1 AND id = $2 RETURNING *`;
        const { rows } = await pool.query(query, [company_id, id]);
        return rows[0];
    }
};

export default ToolsModel;
