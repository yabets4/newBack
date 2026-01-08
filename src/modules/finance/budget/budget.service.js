import BudgetModel from './budget.model.js';

export const BudgetService = {
  async list(companyId) {
    return await BudgetModel.list(companyId);
  },

  async get(companyId, budgetId) {
    return await BudgetModel.findById(companyId, budgetId);
  },

  async create(companyId, payload, createdBy) {
    payload.created_by = createdBy || null;
    // basic validation
    if (!payload.name) throw new Error('Missing budget name');
    return await BudgetModel.insert(companyId, payload);
  },

  async update(companyId, budgetId, payload) {
    // basic validation
    if (!payload || Object.keys(payload).length === 0) throw new Error('Nothing to update');
    return await BudgetModel.update(companyId, budgetId, payload);
  },

  async remove(companyId, budgetId) {
    return await BudgetModel.remove(companyId, budgetId);
  },

  async forecast(companyId, opts) {
    return await BudgetModel.forecast(companyId, opts);
  },

  async checkAvailability(companyId, accountId, amount, date) {
    // 1. Find the applicable budget line for this account and date
    // Note: This requires a method to find budget line by account & date range.
    // For now, let's list budgets and filter in JS (inefficient but works for proof of concept)
    const budgets = await BudgetModel.list(companyId);

    // Find active budget covering the date
    const targetDate = new Date(date);
    const activeBudget = budgets.find(b => {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      return targetDate >= start && targetDate <= end && b.status === 'Posted'; // Assuming 'Posted' means active
    });

    if (!activeBudget) {
      // No budget defined? Strict mode -> Fail? Or Allow?
      // User requested "validate against budgets". If no budget, maybe allow?
      // Let's check implementation plan: "Throw error if exceeded". Implies budget must exist.
      // But if no budget exists, maybe it's not a budgeted account?
      // Let's assume strict: if no budget, assume 0 limit? No, that blocks everything.
      // Let's assume if no budget is found, we skip check (WARN).
      console.warn(`[BudgetService] No active budget found for date ${date}. Skipping check.`);
      return true;
    }

    // Check if account is in this budget
    // budgets list includes lines as JSON 'lines'
    const lines = activeBudget.lines || [];
    const budgetLine = lines.find(l => l.account_id === accountId);

    if (!budgetLine) {
      // Account not budgeted. Strict -> Error? Or Allow?
      // Let's strict: Expense on unbudgeted account -> Warning or Block.
      // Let's Block for control.
      // throw new Error(`Account ${accountId} is not budgeted for the period.`);
      // Actually, relaxing to allow unbudgeted items might be safer for first run.
      return true;
    }

    const budgetLimit = Number(budgetLine.amount);

    // 2. Get Actuals
    const actuals = await BudgetModel.getActuals(companyId, accountId, activeBudget.start_date, activeBudget.end_date);

    // 3. Check
    if (actuals + amount > budgetLimit) {
      throw new Error(`Budget exceeded for account ${accountId}. Limit: ${budgetLimit}, Used: ${actuals}, Requested: ${amount}`);
    }

    return true;
  }
};

export default BudgetService;
