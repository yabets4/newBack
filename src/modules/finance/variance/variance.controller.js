import { ok, badRequest, internal } from '../../../utils/apiResponse.js';
import VarianceService from './variance.service.js';

export async function postCompareBudget(req, res) {
  try {
    const { companyID } = req.auth;
    const { startDate, endDate, budgetId } = req.body || {};

    const data = await VarianceService.compareBudget(companyID, { startDate: startDate || null, endDate: endDate || null, budgetId: budgetId || null });
    return ok(res, data);
  } catch (err) {
    console.error('[VarianceController] compare-budget error:', err);
    return internal(res, err.message || 'Error generating variance analysis');
  }
}

export default { postCompareBudget };
