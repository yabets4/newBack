import { ok, badRequest, internal } from '../../../utils/apiResponse.js';
import FinanceReportService from './report.service.js';

export async function getIncomeStatement(req, res) {
  try {
    const { companyID } = req.auth;
    const { start, end } = req.query;
    const data = await FinanceReportService.incomeStatement(companyID, { startDate: start || null, endDate: end || null });
    return ok(res, data);
  } catch (err) {
    console.error('[FinanceReportController] income-statement error:', err);
    return internal(res, err.message || 'Error generating income statement');
  }
}

export async function getBalanceSheet(req, res) {
  try {
    const { companyID } = req.auth;
    const { asOf } = req.query;
    const data = await FinanceReportService.balanceSheet(companyID, { asOfDate: asOf || null });
    return ok(res, data);
  } catch (err) {
    console.error('[FinanceReportController] balance-sheet error:', err);
    return internal(res, err.message || 'Error generating balance sheet');
  }
}

export async function getCashFlow(req, res) {
  try {
    const { companyID } = req.auth;
    const { start, end } = req.query;
    const data = await FinanceReportService.cashFlow(companyID, { startDate: start || null, endDate: end || null });
    return ok(res, data);
  } catch (err) {
    console.error('[FinanceReportController] cash-flow error:', err);
    return internal(res, err.message || 'Error generating cash flow');
  }
}

export async function postCustomReport(req, res) {
  try {
    const { companyID } = req.auth;
    const { startDate, endDate, accountIds } = req.body || {};

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return badRequest(res, 'At least one accountId is required');
    }

    const data = await FinanceReportService.customReport(companyID, { startDate: startDate || null, endDate: endDate || null, accountIds });
    return ok(res, data);
  } catch (err) {
    console.error('[FinanceReportController] custom-report error:', err);
    return internal(res, err.message || 'Error generating custom report');
  }
}

export async function getCustomReportAccounts(req, res) {
  try {
    const { companyID } = req.auth;
    const data = await FinanceReportService.listAccounts(companyID);
    return ok(res, data);
  } catch (err) {
    console.error('[FinanceReportController] custom-report accounts error:', err);
    return internal(res, err.message || 'Error fetching accounts');
  }
}

export async function getKpiDashboard(req, res) {
  try {
    const { companyID } = req.auth;
    const { start, end } = req.query;
    const data = await FinanceReportService.kpiDashboard(companyID, { startDate: start || null, endDate: end || null });
    return ok(res, data);
  } catch (err) {
    console.error('[FinanceReportController] kpi-dashboard error:', err);
    return internal(res, err.message || 'Error generating KPI dashboard');
  }
}

export default { getIncomeStatement, getBalanceSheet, getCashFlow, postCustomReport, getCustomReportAccounts, getKpiDashboard };
