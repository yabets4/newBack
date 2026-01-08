import pool from '../../../loaders/db.loader.js';

const ReportsModel = {
  async listEmployees(companyId, filters = {}) {
    const params = [companyId];
    let q = `SELECT e.company_id, e.employee_id, e.name, e.gender, e.date_of_birth, e.created_at, d.department, d.hire_date
      FROM employees e
      LEFT JOIN employee_employment_details d
        ON e.company_id = d.company_id AND e.employee_id = d.employee_id
      WHERE e.company_id = $1`;

    if (filters.department) {
      params.push(filters.department);
      q += ` AND d.department = $${params.length}`;
    }
    q += ` ORDER BY e.name ASC`;
    const res = await pool.query(q, params);
    return res.rows || [];
  }
};

export default ReportsModel;
