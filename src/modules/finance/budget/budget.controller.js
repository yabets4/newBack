import BudgetService from './budget.service.js';
import { ok, badRequest, notFound } from '../../../utils/apiResponse.js';

export async function listBudgets(req, res, next) {
  try {
    const companyId = req.auth.companyID;
    const rows = await BudgetService.list(companyId);
    return ok(res, rows);
  } catch (e) { next(e); }
}

export async function getBudget(req, res, next) {
  try {
    const companyId = req.auth.companyID;
    const { id } = req.params;
    const rec = await BudgetService.get(companyId, id);
    if (!rec) return notFound(res, 'Budget not found');
    return ok(res, rec);
  } catch (e) { next(e); }
}

export async function createBudget(req, res, next) {
  try {
    const companyId = req.auth.companyID;
    const createdBy = req.auth.userID || null;
    const payload = { ...req.body };
    const created = await BudgetService.create(companyId, payload, createdBy);
    return ok(res, created);
  } catch (e) {
    if (e.message && e.message.includes('Missing')) return badRequest(res, e.message);
    next(e);
  }
}

export async function updateBudget(req, res, next) {
  try {
    const companyId = req.auth.companyID;
    const { id } = req.params;
    const payload = { ...req.body };
    const updated = await BudgetService.update(companyId, id, payload);
    if (!updated) return notFound(res, 'Budget not found');
    return ok(res, updated);
  } catch (e) { next(e); }
}

export async function deleteBudget(req, res, next) {
  try {
    const companyId = req.auth.companyID;
    const { id } = req.params;
    const deleted = await BudgetService.remove(companyId, id);
    if (!deleted) return notFound(res, 'Budget not found');
    return ok(res, { message: 'Deleted' });
  } catch (e) { next(e); }
}

export async function generateForecast(req, res, next) {
  try {
    const companyId = req.auth.companyID;
    const opts = { startDate: req.body.startDate, endDate: req.body.endDate };
    const forecast = await BudgetService.forecast(companyId, opts);
    return ok(res, forecast);
  } catch (e) { next(e); }
}

export default {
  listBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  generateForecast,
};
