import pool from '../../../loaders/db.loader.js';
import BudgetModel from '../budget/budget.model.js';

export const VarianceService = {
  async compareBudget(companyId, { startDate, endDate, budgetId } = {}) {
    // If a budgetId is provided, use its lines; otherwise return aggregated variances by account
    let budgetLines = [];
    if (budgetId) {
      const b = await BudgetModel.findById(companyId, budgetId);
      if (!b) throw new Error('Budget not found');
      budgetLines = b.lines || [];
    }

    if (budgetLines.length > 0) {
      // For each budget line, fetch actuals from ledger_entries for the date range
      const results = [];
      for (const line of budgetLines) {
        const accountId = line.account_id;
        const params = [companyId, accountId];
        let where = `WHERE le.company_id = $1 AND le.account_id = $2`;
        if (startDate) { params.push(startDate); where += ` AND le.posting_date >= $${params.length}`; }
        if (endDate) { params.push(endDate); where += ` AND le.posting_date <= $${params.length}`; }

        const sql = `
          SELECT COALESCE(SUM(le.debit),0)::numeric AS debit, COALESCE(SUM(le.credit),0)::numeric AS credit
          FROM ledger_entries le
          WHERE le.company_id = $1 AND le.account_id = $2
          ${startDate ? `AND le.posting_date >= $3` : ''}
          ${endDate ? (startDate ? `AND le.posting_date <= $4` : `AND le.posting_date <= $3`) : ''}
        `;

        const res = await pool.query(sql, params);
        const debit = Number(res.rows?.[0]?.debit || 0);
        const credit = Number(res.rows?.[0]?.credit || 0);
        const actual = debit - credit; // expense natural balance for many systems; will keep raw

        const budgetAmount = Number(line.amount || 0);
        const varianceAmount = actual - budgetAmount;
        const variancePercentage = budgetAmount !== 0 ? (varianceAmount / budgetAmount) * 100 : null;

        results.push({
          budgetLineId: line.budget_line_id,
          accountId,
          description: line.description || null,
          budgetAmount,
          actualAmount: actual,
          varianceAmount,
          variancePercentage,
        });
      }

      return { startDate: startDate || null, endDate: endDate || null, budgetId, results };
    }

    // No budget specified: provide simple period vs period aggregated summary by account_type
    const params = [companyId];
    let where = 'WHERE le.company_id = $1';
    if (startDate) { params.push(startDate); where += ` AND le.posting_date >= $${params.length}`; }
    if (endDate) { params.push(endDate); where += ` AND le.posting_date <= $${params.length}`; }

    const sql = `
      SELECT coa.account_id, coa.account_name, coa.account_number, coa.account_type,
             COALESCE(SUM(le.debit),0) AS debit, COALESCE(SUM(le.credit),0) AS credit
      FROM ledger_entries le
      JOIN chart_of_accounts coa ON coa.company_id = le.company_id AND coa.account_id = le.account_id
      ${where}
      GROUP BY coa.account_id, coa.account_name, coa.account_number, coa.account_type
      ORDER BY coa.account_number NULLS LAST, coa.account_name
    `;

    const res = await pool.query(sql, params);
    const rows = res.rows || [];

    const summary = rows.map(r => {
      const debit = Number(r.debit) || 0;
      const credit = Number(r.credit) || 0;
      const amount = r.account_type === 'Revenue' ? (credit - debit) : (debit - credit);
      return {
        accountId: r.account_id,
        accountName: r.account_name,
        accountType: r.account_type,
        amount,
      };
    });

    return { startDate: startDate || null, endDate: endDate || null, summary };
  }
};

export default VarianceService;
