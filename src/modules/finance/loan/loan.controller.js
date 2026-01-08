import { ok, created, internal, badRequest } from '../../../utils/apiResponse.js';
import LoanService from './loan.service.js';

export async function listLoans(req, res) {
  try {
    const { companyID } = req.auth;
    const data = await LoanService.list(companyID);
    return ok(res, { loans: data });
  } catch (err) {
    console.error('[LoanController] list error:', err);
    return internal(res, err.message || 'Error listing loans');
  }
}

export async function createLoan(req, res) {
  try {
    const { companyID } = req.auth;
    const payload = req.body || {};
    if (!payload.name || !payload.originalAmount) return badRequest(res, 'Missing required loan fields');
    const data = await LoanService.create(companyID, payload);
    return created(res, data);
  } catch (err) {
    console.error('[LoanController] create error:', err);
    return internal(res, err.message || 'Error creating loan');
  }
}

export async function getLoanSchedule(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const data = await LoanService.amortizationSchedule(companyID, id);
    if (!data) return badRequest(res, 'Loan not found');
    return ok(res, { schedule: data });
  } catch (err) {
    console.error('[LoanController] schedule error:', err);
    return internal(res, err.message || 'Error calculating schedule');
  }
}

export async function listLiabilities(req, res) {
  try {
    const { companyID } = req.auth;
    const data = await LoanService.listLiabilities(companyID);
    return ok(res, { liabilities: data });
  } catch (err) {
    console.error('[LoanController] list liabilities error:', err);
    return internal(res, err.message || 'Error listing liabilities');
  }
}

export async function createLiability(req, res) {
  try {
    const { companyID } = req.auth;
    const payload = req.body || {};
    if (!payload.name || !payload.amount) return badRequest(res, 'Missing liability fields');
    const data = await LoanService.createLiability(companyID, payload);
    return created(res, data);
  } catch (err) {
    console.error('[LoanController] create liability error:', err);
    return internal(res, err.message || 'Error creating liability');
  }
}

export async function markLiabilityPaid(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const data = await LoanService.markLiabilityPaid(companyID, id);
    if (!data) return badRequest(res, 'Liability not found');
    return ok(res, data);
  } catch (err) {
    console.error('[LoanController] mark paid error:', err);
    return internal(res, err.message || 'Error updating liability');
  }
}

export default { listLoans, createLoan, getLoanSchedule, listLiabilities, createLiability, markLiabilityPaid };
