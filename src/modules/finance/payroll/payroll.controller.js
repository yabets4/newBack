import { ok, created, internal, badRequest } from '../../../utils/apiResponse.js';
import PayrollService from './payroll.service.js';

export async function getSummary(req, res) {
  try {
    const { companyID } = req.auth;
    const data = await PayrollService.getSummary(companyID);
    return ok(res, data);
  } catch (err) {
    console.error('[PayrollController] summary error:', err);
    return internal(res, 'Error fetching payroll summary');
  }
}

export async function getHistory(req, res) {
  try {
    const { companyID } = req.auth;
    const data = await PayrollService.getHistory(companyID);
    return ok(res, data);
  } catch (err) {
    console.error('[PayrollController] history error:', err);
    return internal(res, 'Error fetching payroll history');
  }
}

export async function postRun(req, res) {
  try {
    const { companyID } = req.auth;
    const payload = req.body || {};
    if (!payload.payPeriod) return badRequest(res, 'payPeriod is required');
    const createdRow = await PayrollService.postRun(companyID, payload);
    return created(res, createdRow);
  } catch (err) {
    console.error('[PayrollController] post error:', err);
    return internal(res, 'Error posting payroll to ledger');
  }
}

export default { getSummary, getHistory, postRun };
