import pool from '../../../loaders/db.loader.js';

const ToolAssignmentModel = {
    findAll: async (company_id) => {
        // Determine which columns exist in project_tool_assignments to avoid referencing non-existent columns
        const colCheckQuery = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'project_tool_assignments'
              AND column_name IN ('tool_id', 'tool_type_id', 'status')
        `;
        const { rows: colRows } = await pool.query(colCheckQuery);
        const cols = colRows.map(r => r.column_name);

        let joinCondition = '';
        if (cols.includes('tool_id')) {
            joinCondition = 'tm.id = pta.tool_id';
        } else if (cols.includes('tool_type_id')) {
            // tool_type_id stores a type string that matches tools_machinery.type
            joinCondition = "tm.type = pta.tool_type_id";
        } else {
            // fallback: no matching column — keep join false so we still list tools
            joinCondition = 'FALSE';
        }

        const hasStatus = cols.includes('status');
        const statusCondition = hasStatus ? " AND pta.status IN ('Assigned', 'In Use')" : '';

        const query = `
            SELECT 
                tm.id,
                tm.name,
                tm.type,
                tm.location,
                tm.status,
                tm.next_maintenance_date,
                pta.project_id,
                p.name as project_name,
                pta.assigned_employee_id,
                e.name as assigned_employee_name,
                pta.end_date as return_due
            FROM tools_machinery tm
            LEFT JOIN project_tool_assignments pta ON ${joinCondition}${statusCondition}
            LEFT JOIN projects p ON pta.project_id = p.project_id AND pta.company_id = p.company_id
            LEFT JOIN employees e ON pta.assigned_employee_id = e.employee_id AND pta.company_id = e.company_id
            WHERE tm.company_id = $1
            ORDER BY tm.name;
        `;

        const { rows } = await pool.query(query, [company_id]);
        return rows;
    },

    /**
     * Creates a new tool assignment.
     */
    create: async (data) => {
        const {
            company_id,
            project_id,
            tool_id,
            assigned_employee_id,
            start_date,
            end_date,
            notes
        } = data;

        const query = `
            INSERT INTO project_tool_assignments (
                company_id, project_id, tool_id, assigned_employee_id, start_date, end_date, notes, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Assigned')
            RETURNING *;
        `;
        const values = [company_id, project_id, tool_id, assigned_employee_id, start_date, end_date, notes];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    /**
     * Updates an existing tool assignment.
     */
    update: async (id, data) => {
        const {
            project_id,
            tool_id,
            assigned_employee_id,
            start_date,
            end_date,
            status,
            notes
        } = data;

        const query = `
            UPDATE project_tool_assignments
            SET 
                project_id = $1,
                tool_id = $2,
                assigned_employee_id = $3,
                start_date = $4,
                end_date = $5,
                status = $6,
                notes = $7,
                updated_at = NOW()
            WHERE id = $8
            RETURNING *;
        `;
        const values = [project_id, tool_id, assigned_employee_id, start_date, end_date, status, notes, id];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    /**
     * Deletes a tool assignment.
     */
    delete: async (id) => {
        const query = 'DELETE FROM project_tool_assignments WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }
};

export default ToolAssignmentModel;
