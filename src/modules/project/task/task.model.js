import pool from '../../../loaders/db.loader.js';

export const TaskModel = {
  async create(companyId, projectId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // validate assignee exists for this company; if not, null it to avoid FK violation
      let assigneeId = data.assignee_id || null;
      if (assigneeId) {
        const { rows: userRows } = await client.query('SELECT 1 FROM users WHERE company_id = $1 AND user_id = $2 LIMIT 1', [companyId, assigneeId]);
        if (!userRows || userRows.length === 0) {
          assigneeId = null;
        }
      }
      const insertQuery = `
        INSERT INTO tasks (
          company_id, project_id, name, description, status, priority, assignee_id, start_date, due_date, progress,
          qc_required, qc_result, rework_reason, labor_hours, material_costs, incentive, penalty, materials_used, tools_used,
          duration, dependencies, rework_of_task_id
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
        ) RETURNING id;
      `;
      const values = [
        companyId,
        projectId,
        data.name,
        data.description || null,
        data.status || 'Not Started',
        data.priority || 'Medium',
        assigneeId,
        data.start_date || null,
        data.due_date || null,
        data.progress || 0,
        data.qc_required || false,
        data.qc_result || null,
        data.rework_reason || null,
        data.labor_hours || 0,
        data.material_costs || 0,
        data.incentive || 0,
        data.penalty || 0,
        data.materials_used ? JSON.stringify(data.materials_used) : null,
        data.tools_used ? JSON.stringify(data.tools_used) : null,
        data.duration || null,
        data.dependencies ? JSON.stringify(data.dependencies) : null,
        data.rework_of_task_id || null,
      ];

      const { rows } = await client.query(insertQuery, values);
      const newId = rows[0].id;
      // generate task_id like TSK-000001
      const taskId = `TSK-${String(newId).padStart(6, '0')}`;
      await client.query('UPDATE tasks SET task_id = $2 WHERE id = $1', [newId, taskId]);
      await client.query('COMMIT');
      const { rows: r } = await pool.query('SELECT * FROM tasks WHERE id = $1', [newId]);
      return r[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async findAll(companyId, projectId) {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE company_id = $1 AND project_id = $2 ORDER BY created_at', [companyId, projectId]);
    return rows;
  },

  async findById(companyId, projectId, taskId) {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE company_id = $1 AND project_id = $2 AND (task_id = $3 OR id::text = $3) LIMIT 1', [companyId, projectId, taskId]);
    return rows[0];
  },

  async update(companyId, projectId, taskId, data) {
    // allow taskId to be numeric id or task_id string
    const query = `
      UPDATE tasks SET
        name = $4,
        description = $5,
        status = $6,
        priority = $7,
        assignee_id = $8,
        start_date = $9,
        due_date = $10,
        progress = $11,
        qc_required = $12,
        qc_result = $13,
        rework_reason = $14,
        labor_hours = $15,
        material_costs = $16,
        incentive = $17,
        penalty = $18,
        materials_used = $19,
        tools_used = $20,
        duration = $21,
        dependencies = $22,
        rework_of_task_id = $23,
        updated_at = NOW()
      WHERE company_id = $1 AND project_id = $2 AND (task_id = $3 OR id::text = $3)
      RETURNING *;
    `;
    // validate assignee exists for this company; if not, null it to avoid FK violation
    let assigneeId = data.assignee_id || null;
    if (assigneeId) {
      const { rows: userRows } = await pool.query('SELECT 1 FROM users WHERE company_id = $1 AND user_id = $2 LIMIT 1', [companyId, assigneeId]);
      if (!userRows || userRows.length === 0) {
        assigneeId = null;
      }
    }

    const values = [
      companyId,
      projectId,
      taskId,
      data.name,
      data.description || null,
      data.status || 'Not Started',
      data.priority || 'Medium',
      assigneeId,
      data.start_date || null,
      data.due_date || null,
      data.progress || 0,
      data.qc_required || false,
      data.qc_result || null,
      data.rework_reason || null,
      data.labor_hours || 0,
      data.material_costs || 0,
      data.incentive || 0,
      data.penalty || 0,
      data.materials_used ? JSON.stringify(data.materials_used) : null,
      data.tools_used ? JSON.stringify(data.tools_used) : null,
      data.duration || null,
      data.dependencies ? JSON.stringify(data.dependencies) : null,
      data.rework_of_task_id || null,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async remove(companyId, projectId, taskId) {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE company_id = $1 AND project_id = $2 AND (task_id = $3 OR id::text = $3)', [companyId, projectId, taskId]);
    return rowCount > 0;
  }
};

export default TaskModel;
