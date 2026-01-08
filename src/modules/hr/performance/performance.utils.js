import pool from '../../../loaders/db.loader.js';

export async function getEmployeeName(companyId, employeeId) {
    if (!employeeId) return null;

    try {
        const { rows } = await pool.query(
            `SELECT name FROM employees WHERE company_id = $1 AND employee_id = $2`,
            [companyId, employeeId]
        );

        return rows[0]?.name || null;
    } catch (error) {
        console.error('Error fetching employee name:', error);
        return null;
    }
}
