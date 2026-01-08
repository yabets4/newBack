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

  // Fetch a department and its associated jobs together
  async findWithJobs(companyId, departmentId) {
    const department = await this.findById(companyId, departmentId);
    if (!department) return null;
    const jobs = await this.findJobs(companyId, departmentId);
    return {
      ...department,
      jobs,
    };
  },

  // Fetch all departments for a company and include their jobs
  async findAllWithJobs(companyId) {
    const departments = await this.findAll(companyId);
    if (!departments || departments.length === 0) return [];

    const res = await pool.query(
      `SELECT * FROM jobs WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    );
    const jobs = res.rows || [];

    const jobsByDept = jobs.reduce((acc, j) => {
      const key = j.department_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(j);
      return acc;
    }, {});

    return departments.map(d => ({
      ...d,
      jobs: jobsByDept[d.department_id] || [],
    }));
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
  },

  // Job Levels
  async createJobLevel(companyId, departmentId, jobId, data) {
    const res = await pool.query(
      `INSERT INTO job_levels (company_id, department_id, job_id, level_id, level_name, level_order, promotion_condition, min_salary, max_salary) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        companyId,
        departmentId,
        jobId,
        data.level_id,
        data.level_name,
        data.level_order,
        data.promotion_condition || null,
        data.min_salary || null,
        data.max_salary || null
      ]
    );
    return res.rows[0];
  },

  async findJobLevels(companyId, departmentId, jobId) {
    const res = await pool.query(
      `SELECT * FROM job_levels 
       WHERE company_id=$1 AND department_id=$2 AND job_id=$3 
       ORDER BY level_order ASC`,
      [companyId, departmentId, jobId]
    );
    return res.rows;
  },

  async findJobLevelById(companyId, departmentId, jobId, levelId) {
    const res = await pool.query(
      `SELECT * FROM job_levels 
       WHERE company_id=$1 AND department_id=$2 AND job_id=$3 AND level_id=$4 
       LIMIT 1`,
      [companyId, departmentId, jobId, levelId]
    );
    return res.rows[0] || null;
  },

  async updateJobLevel(companyId, departmentId, jobId, levelId, data) {
    const res = await pool.query(
      `UPDATE job_levels 
       SET level_name=$1, level_order=$2, promotion_condition=$3, min_salary=$4, max_salary=$5, updated_at=NOW() 
       WHERE company_id=$6 AND department_id=$7 AND job_id=$8 AND level_id=$9 
       RETURNING *`,
      [
        data.level_name,
        data.level_order,
        data.promotion_condition || null,
        data.min_salary || null,
        data.max_salary || null,
        companyId,
        departmentId,
        jobId,
        levelId
      ]
    );
    return res.rows[0];
  },

  async removeJobLevel(companyId, departmentId, jobId, levelId) {
    const res = await pool.query(
      `DELETE FROM job_levels 
       WHERE company_id=$1 AND department_id=$2 AND job_id=$3 AND level_id=$4`,
      [companyId, departmentId, jobId, levelId]
    );
    return res.rowCount > 0;
  },

  // Get a job with all its levels
  async findJobWithLevels(companyId, departmentId, jobId) {
    const job = await this.findJobById(companyId, departmentId, jobId);
    if (!job) return null;

    const levels = await this.findJobLevels(companyId, departmentId, jobId);
    return {
      ...job,
      levels
    };
  },

  // Get all jobs with their levels for a department
  async findJobsWithLevels(companyId, departmentId) {
    const jobs = await this.findJobs(companyId, departmentId);

    // Fetch all levels for this department at once
    const levelsRes = await pool.query(
      `SELECT * FROM job_levels 
       WHERE company_id=$1 AND department_id=$2 
       ORDER BY job_id, level_order ASC`,
      [companyId, departmentId]
    );
    const allLevels = levelsRes.rows || [];

    // Group levels by job_id
    const levelsByJob = allLevels.reduce((acc, level) => {
      if (!acc[level.job_id]) acc[level.job_id] = [];
      acc[level.job_id].push(level);
      return acc;
    }, {});

    // Attach levels to each job
    return jobs.map(job => ({
      ...job,
      levels: levelsByJob[job.job_id] || []
    }));
  }
};
