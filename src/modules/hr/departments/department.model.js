import pool from '../../../loaders/db.loader.js';

export const DepartmentModel = {
  async create(companyId, data) {
    const res = await pool.query(
      `INSERT INTO departments (company_id, department_id, name, description) VALUES ($1,$2,$3,$4) RETURNING *`,
      [companyId, data.department_id, data.name, data.description || null]
    );
    return res.rows[0];
  },

  async findAll(companyId) {
    const res = await pool.query(
      `SELECT * FROM departments WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    );
    return res.rows;
  },

  async findById(companyId, departmentId) {
    const res = await pool.query(
      `SELECT * FROM departments WHERE company_id = $1 AND department_id = $2 LIMIT 1`,
      [companyId, departmentId]
    );
    return res.rows[0] || null;
  },

  async update(companyId, departmentId, data) {
    const res = await pool.query(
      `UPDATE departments SET name=$1, description=$2, updated_at=NOW() WHERE company_id=$3 AND department_id=$4 RETURNING *`,
      [data.name, data.description || null, companyId, departmentId]
    );
    return res.rows[0];
  },

  async remove(companyId, departmentId) {
    const res = await pool.query(
      `DELETE FROM departments WHERE company_id=$1 AND department_id=$2`,
      [companyId, departmentId]
    );
    return res.rowCount > 0;
  },

  // Jobs
  async createJob(companyId, departmentId, data) {
    const res = await pool.query(
      `INSERT INTO jobs (company_id, department_id, job_id, title, description, salary_from, salary_to) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [companyId, departmentId, data.job_id, data.title, data.description || null, data.salary_from || null, data.salary_to || null]
    );
    return res.rows[0];
  },

  async findJobs(companyId, departmentId) {
    const res = await pool.query(
      `SELECT * FROM jobs WHERE company_id=$1 AND department_id=$2 ORDER BY created_at DESC`,
      [companyId, departmentId]
    );
    return res.rows;
  },

  async findJobById(companyId, departmentId, jobId) {
    const res = await pool.query(
      `SELECT * FROM jobs WHERE company_id=$1 AND department_id=$2 AND job_id=$3 LIMIT 1`,
      [companyId, departmentId, jobId]
    );
    return res.rows[0] || null;
  },

  async updateJob(companyId, departmentId, jobId, data) {
    const res = await pool.query(
      `UPDATE jobs SET title=$1, description=$2, salary_from=$3, salary_to=$4, updated_at=NOW() WHERE company_id=$5 AND department_id=$6 AND job_id=$7 RETURNING *`,
      [data.title, data.description || null, data.salary_from || null, data.salary_to || null, companyId, departmentId, jobId]
    );
    return res.rows[0];
  },

  async removeJob(companyId, departmentId, jobId) {
    const res = await pool.query(
      `DELETE FROM jobs WHERE company_id=$1 AND department_id=$2 AND job_id=$3`,
      [companyId, departmentId, jobId]
    );
    return res.rowCount > 0;
  }
};
