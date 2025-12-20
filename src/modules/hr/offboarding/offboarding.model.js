import pool from '../../../loaders/db.loader.js';

export const OffboardingModel = {
  async createTemplate(companyId, data) {
    let tasks = [];
    if (Array.isArray(data.tasks)) tasks = data.tasks;
    else if (typeof data.tasks === 'string') {
      try { tasks = JSON.parse(data.tasks); } catch (e) { tasks = []; }
    }
    const { rows } = await pool.query(
      `INSERT INTO offboarding_templates (company_id, template_id, name, description, tasks)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [companyId, data.template_id || `TPL-${Date.now()}`, data.name, data.description || null, JSON.stringify(tasks)]
    );
    return rows[0];
  },

  async listTemplates(companyId) {
    const { rows } = await pool.query(`SELECT * FROM offboarding_templates WHERE company_id = $1 ORDER BY created_at DESC`, [companyId]);
    return rows;
  },

  async getTemplate(companyId, id) {
    const { rows } = await pool.query(`SELECT * FROM offboarding_templates WHERE company_id = $1 AND (template_id = $2 OR id::text = $2) LIMIT 1`, [companyId, id]);
    return rows[0] || null;
  },

  async updateTemplate(companyId, id, data) {
    let tasks = [];
    if (Array.isArray(data.tasks)) tasks = data.tasks;
    else if (typeof data.tasks === 'string') {
      try { tasks = JSON.parse(data.tasks); } catch (e) { tasks = []; }
    }
    const { rows } = await pool.query(
      `UPDATE offboarding_templates SET name = $3, description = $4, tasks = $5, updated_at = NOW()
       WHERE company_id = $1 AND (template_id = $2 OR id::text = $2) RETURNING *`,
      [companyId, id, data.name, data.description || null, JSON.stringify(tasks)]
    );
    return rows[0] || null;
  },

  async deleteTemplate(companyId, id) {
    const { rowCount } = await pool.query(`DELETE FROM offboarding_templates WHERE company_id = $1 AND (template_id = $2 OR id::text = $2)`, [companyId, id]);
    return rowCount > 0;
  },

  async createProcess(companyId, data) {
    const processId = data.process_id || `PROC-${Date.now()}`;
    let tasks = [];
    if (Array.isArray(data.tasks)) tasks = data.tasks;
    else if (typeof data.tasks === 'string') {
      try { tasks = JSON.parse(data.tasks); } catch (e) { tasks = []; }
    }
    const { rows } = await pool.query(
      `INSERT INTO offboarding_processes (company_id, process_id, employee_id, template_id, start_date, status, tasks)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [companyId, processId, data.employee_id || null, data.template_id || null, data.start_date || null, data.status || 'in_progress', JSON.stringify(tasks)]
    );
    return rows[0];
  },

  async listProcesses(companyId, opts = {}) {
    const params = [companyId];
    let where = 'WHERE company_id = $1';
    if (opts.employee_id) { params.push(opts.employee_id); where += ` AND employee_id = $${params.length}`; }
    if (opts.status) { params.push(opts.status); where += ` AND status = $${params.length}`; }
    const { rows } = await pool.query(`SELECT * FROM offboarding_processes ${where} ORDER BY created_at DESC`, params);
    return rows;
  },

  async getProcess(companyId, id) {
    const { rows } = await pool.query(`SELECT * FROM offboarding_processes WHERE company_id = $1 AND (process_id = $2 OR id::text = $2) LIMIT 1`, [companyId, id]);
    return rows[0] || null;
  },

  async updateProcess(companyId, id, data) {
    let tasks = [];
    if (Array.isArray(data.tasks)) tasks = data.tasks;
    else if (typeof data.tasks === 'string') {
      try { tasks = JSON.parse(data.tasks); } catch (e) { tasks = []; }
    }
    const { rows } = await pool.query(
      `UPDATE offboarding_processes SET employee_id = $3, template_id = $4, start_date = $5, status = $6, tasks = $7, updated_at = NOW()
       WHERE company_id = $1 AND (process_id = $2 OR id::text = $2) RETURNING *`,
      [companyId, id, data.employee_id || null, data.template_id || null, data.start_date || null, data.status || 'in_progress', JSON.stringify(tasks)]
    );
    return rows[0] || null;
  },

  async deleteProcess(companyId, id) {
    const { rowCount } = await pool.query(`DELETE FROM offboarding_processes WHERE company_id = $1 AND (process_id = $2 OR id::text = $2)`, [companyId, id]);
    return rowCount > 0;
  },

  async updateTaskStatus(companyId, processId, taskId, newStatus) {
    const proc = await this.getProcess(companyId, processId);
    if (!proc) return null;
    let tasks = Array.isArray(proc.tasks) ? proc.tasks : [];
    let changed = false;
    tasks = tasks.map(t => {
      if ((t.id && t.id.toString() === taskId.toString()) || t.task_id === taskId || t.id === taskId) {
        changed = true;
        return { ...t, status: newStatus, completionDate: newStatus === 'completed' ? new Date().toISOString().slice(0,10) : null };
      }
      return t;
    });
    if (!changed) return proc;
    const { rows } = await pool.query(`UPDATE offboarding_processes SET tasks = $3, updated_at = NOW() WHERE company_id = $1 AND (process_id = $2 OR id::text = $2) RETURNING *`, [companyId, processId, JSON.stringify(tasks)]);
    return rows[0] || null;
  }
};

export default OffboardingModel;
