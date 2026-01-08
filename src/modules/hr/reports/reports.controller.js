import { ok, internal, badRequest } from '../../../utils/apiResponse.js';
import ReportsService from './reports.service.js';

export async function dashboard(req, res) {
  try {
    const { companyID } = req.auth;
    const categories = await ReportsService.dashboard(companyID);
    return ok(res, categories);
  } catch (err) {
    console.error('[ReportsController] dashboard error:', err);
    return internal(res, 'Error fetching reports dashboard');
  }
}

export async function getReport(req, res) {
  try {
    const { companyID } = req.auth;
    const { reportId } = req.params;
    const filters = {
      department: req.query.department || null,
      status: req.query.status || null,
      year: req.query.year || null,
    };
    const result = await ReportsService.getReport(companyID, reportId, filters);
    return ok(res, result.data);
  } catch (err) {
    console.error('[ReportsController] getReport error:', err);
    return internal(res, 'Error generating report');
  }
}

export default { dashboard, getReport };
