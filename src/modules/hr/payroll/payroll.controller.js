import { ok, created, internal, badRequest, notFound } from '../../../utils/apiResponse.js';
import PayrollService from './payroll.service.js';

export async function getCompensation(req, res) {
  try {
    const { companyID } = req.auth;
    const { employeeId } = req.params;
    const row = await PayrollService.getCompensation(companyID, employeeId);
    if (!row) return notFound(res, 'Compensation not found');
    return ok(res, row);
  } catch (err) {
    console.error('[PayrollController] getComp error:', err);
    return internal(res, 'Error fetching compensation');
  }
}

export async function upsertCompensation(req, res) {
  try {
    const { companyID } = req.auth;
    const { employeeId } = req.params;
    const payload = req.body || {};
    const updated = await PayrollService.upsertCompensation(companyID, employeeId, payload);
    return ok(res, updated);
  } catch (err) {
    console.error('[PayrollController] upsertComp error:', err);
    return internal(res, 'Error saving compensation');
  }
}

export async function processPayroll(req, res) {
  try {
    const { companyID } = req.auth;
    const payload = req.body || {};
    if (!payload.payPeriod) return badRequest(res, 'payPeriod is required');
    const result = await PayrollService.processPayroll(companyID, payload);
    return created(res, result);
  } catch (err) {
    console.error('[PayrollController] process error:', err);
    return internal(res, err.message || 'Error processing payroll');
  }
}

export async function listPayrollRuns(req, res) {
  try {
    const { companyID } = req.auth;
    const rows = await PayrollService.listPayrollRuns(companyID);
    return ok(res, rows);
  } catch (err) {
    console.error('[PayrollController] list runs error:', err);
    return internal(res, 'Error fetching payroll runs');
  }
}

export async function getPayrollRun(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const row = await PayrollService.getPayrollRun(companyID, id);
    if (!row) return notFound(res, 'Payroll run not found');
    return ok(res, row);
  } catch (err) {
    console.error('[PayrollController] get run error:', err);
    return internal(res, 'Error fetching payroll run');
  }
}

export async function listPayslips(req, res) {
  try {
    const { companyID } = req.auth;
    const rows = await PayrollService.listPayslips(companyID);
    return ok(res, rows);
  } catch (err) {
    console.error('[PayrollController] list payslips error:', err);
    return internal(res, 'Error fetching payslips');
  }
}

export async function getPayslip(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const row = await PayrollService.getPayslip(companyID, id);
    if (!row) return notFound(res, 'Payslip not found');
    return ok(res, row);
  } catch (err) {
    console.error('[PayrollController] get payslip error:', err);
    return internal(res, 'Error fetching payslip');
  }
}

export default { getCompensation, upsertCompensation, processPayroll, listPayrollRuns, getPayrollRun, listPayslips, getPayslip };
