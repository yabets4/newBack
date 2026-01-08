import pool from '../../../loaders/db.loader.js';

export const BudgetModel = {
  async list(companyId) {
    const res = await pool.query(
      `SELECT b.*, COALESCE(json_agg(bl.*) FILTER (WHERE bl.budget_line_id IS NOT NULL), '[]') AS lines
       FROM budgets b
       LEFT JOIN budget_lines bl ON b.company_id = bl.company_id AND b.budget_id = bl.budget_id
       WHERE b.company_id = $1
       GROUP BY b.company_id, b.budget_id
       ORDER BY b.created_at DESC`,
      [companyId]
    );
    return res.rows;
  },

  async findById(companyId, budgetId) {
    const res = await pool.query(
      `SELECT b.*, COALESCE(json_agg(bl.*) FILTER (WHERE bl.budget_line_id IS NOT NULL), '[]') AS lines
       FROM budgets b
       LEFT JOIN budget_lines bl ON b.company_id = bl.company_id AND b.budget_id = bl.budget_id
       WHERE b.company_id = $1 AND b.budget_id = $2
       GROUP BY b.company_id, b.budget_id
       LIMIT 1`,
      [companyId, budgetId]
    );
    return res.rows[0] || null;
  },

  async insert(companyId, payload) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate next budget id using companies.next_budget_number
      const nextRes = await client.query(
        `UPDATE companies SET next_budget_number = next_budget_number + 1 WHERE company_id = $1 RETURNING next_budget_number`,
        [companyId]
      );
      const nextNum = nextRes.rows[0]?.next_budget_number || Date.now();
      const budgetId = payload.budget_id || `BUD-${String(nextNum).padStart(4, '0')}`;

      const insertBudgetRes = await client.query(
        `INSERT INTO budgets (company_id, budget_id, name, start_date, end_date, status, total_amount, created_by, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) RETURNING *`,
        [companyId, budgetId, payload.name, payload.start_date || null, payload.end_date || null, payload.status || 'Draft', payload.total_amount || 0, payload.created_by || null]
      );

      // Insert lines if any
      if (Array.isArray(payload.lines) && payload.lines.length > 0) {
        for (const l of payload.lines) {
          const lineId = l.budget_line_id || `BL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await client.query(
            `INSERT INTO budget_lines (company_id, budget_id, budget_line_id, account_id, description, amount, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
            [companyId, budgetId, lineId, l.account_id || null, l.description || null, l.amount || 0]
          );
        }
      }

      await client.query('COMMIT');
      return await this.findById(companyId, budgetId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(companyId, budgetId, payload) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update header
      const updateRes = await client.query(
        `UPDATE budgets SET
           name = $3,
           start_date = $4,
           end_date = $5,
           status = $6,
           total_amount = $7,
           updated_at = NOW()
         WHERE company_id = $1 AND budget_id = $2 RETURNING *`,
        [companyId, budgetId, payload.name || null, payload.start_date || null, payload.end_date || null, payload.status || 'Draft', payload.total_amount || 0]
      );

      // Replace lines if provided (simple strategy: delete existing and re-insert)
      if (Array.isArray(payload.lines)) {
        await client.query(`DELETE FROM budget_lines WHERE company_id = $1 AND budget_id = $2`, [companyId, budgetId]);
        for (const l of payload.lines) {
          const lineId = l.budget_line_id || `BL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await client.query(
            `INSERT INTO budget_lines (company_id, budget_id, budget_line_id, account_id, description, amount, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
            [companyId, budgetId, lineId, l.account_id || null, l.description || null, l.amount || 0]
          );
        }
      }

      await client.query('COMMIT');
      return await this.findById(companyId, budgetId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async remove(companyId, budgetId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const before = await client.query(`SELECT * FROM budgets WHERE company_id = $1 AND budget_id = $2 LIMIT 1`, [companyId, budgetId]);
      if (!before.rows.length) { await client.query('ROLLBACK'); return null; }
      await client.query(`DELETE FROM budget_lines WHERE company_id = $1 AND budget_id = $2`, [companyId, budgetId]);
      await client.query(`DELETE FROM budgets WHERE company_id = $1 AND budget_id = $2`, [companyId, budgetId]);
      await client.query('COMMIT');
      return before.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Simplistic forecast utility - totals budgeted amounts between dates
  async forecast(companyId, opts = {}) {
    const { startDate, endDate } = opts;
    const params = [companyId];
    let where = `WHERE b.company_id = $1`;
    if (startDate) { params.push(startDate); where += ` AND (b.start_date IS NULL OR b.start_date >= $${params.length})`; }
    if (endDate) { params.push(endDate); where += ` AND (b.end_date IS NULL OR b.end_date <= $${params.length})`; }

    const res = await pool.query(
      `SELECT COALESCE(SUM(bl.amount),0)::numeric AS projected_amount
       FROM budgets b
       LEFT JOIN budget_lines bl ON b.company_id = bl.company_id AND b.budget_id = bl.budget_id
       ${where}`,
      params
    );

    return { projectedAmount: Number(res.rows[0].projected_amount || 0) };
  },

  // Calculate actuals from posted journal lines (Expense accounts usually have debit balance, so use debit - credit)
  async getActuals(companyId, accountId, startDate, endDate) {
    const res = await pool.query(
      `SELECT COALESCE(SUM(jl.debit - jl.credit), 0) as actual_amount
       FROM journal_lines jl
       JOIN journal_entries je ON jl.company_id = je.company_id AND jl.journal_id = je.journal_id
       WHERE jl.company_id = $1 
         AND jl.account_id = $2
         AND je.status = 'Posted'
         AND je.journal_date BETWEEN $3 AND $4`,
      [companyId, accountId, startDate, endDate]
    );
    return Number(res.rows[0].actual_amount || 0);
  }
};

export default BudgetModel;
