import { ok, created, internal, badRequest } from '../../../utils/apiResponse.js';
import TaxService from './tax.service.js';

export async function getSettings(req, res) {
  try {
    const { companyID } = req.auth;
    const settings = await TaxService.getSettings(companyID);
    return ok(res, settings);
  } catch (err) {
    console.error('[TaxController] getSettings error:', err);
    return internal(res, 'Error fetching tax settings');
  }
}

export async function upsertSettings(req, res) {
  try {
    const { companyID } = req.auth;
    const payload = req.body || {};
    const updated = await TaxService.upsertSettings(companyID, payload);
    return ok(res, updated);
  } catch (err) {
    console.error('[TaxController] upsertSettings error:', err);
    return internal(res, 'Error updating tax settings');
  }
}

export async function calculateTax(req, res) {
  try {
    const { companyID } = req.auth;
    const payload = req.body || {};
    if (typeof payload.grossPay === 'undefined') return badRequest(res, 'grossPay is required');
    const result = await TaxService.calculate(companyID, payload);
    return ok(res, result);
  } catch (err) {
    console.error('[TaxController] calculate error:', err);
    return internal(res, 'Error calculating tax');
  }
}

export async function listFilings(req, res) {
  try {
    const { companyID } = req.auth;
    const rows = await TaxService.listFilings(companyID);
    return ok(res, rows);
  } catch (err) {
    console.error('[TaxController] listFilings error:', err);
    return internal(res, 'Error fetching filings');
  }
}

export async function createFiling(req, res) {
  try {
    const { companyID } = req.auth;
    const payload = req.body || {};
    if (!payload.period) return badRequest(res, 'period is required');
    const created = await TaxService.createFiling(companyID, payload);
    return created ? created(res, created) : ok(res, created);
  } catch (err) {
    console.error('[TaxController] createFiling error:', err);
    return internal(res, 'Error creating filing');
  }
}

export default { getSettings, upsertSettings, calculateTax, listFilings, createFiling };
