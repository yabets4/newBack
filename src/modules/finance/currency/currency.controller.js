import CurrencyService from './currency.service.js';
import { ok, created, notFound, internal } from '../../../utils/apiResponse.js';

export async function listCurrencies(req, res) {
  try {
    const { companyID } = req.auth;
    const rows = await CurrencyService.listCurrencies(companyID);
    return ok(res, rows);
  } catch (err) {
    console.error('[CurrencyController] list error', err);
    return internal(res, err.message || 'Error listing currencies');
  }
}

export async function createCurrency(req, res) {
  try {
    const { companyID } = req.auth;
    const payload = { ...req.body };
    const createdCur = await CurrencyService.createCurrency(companyID, payload);
    return created(res, createdCur);
  } catch (err) {
    console.error('[CurrencyController] create error', err);
    return internal(res, err.message || 'Error creating currency');
  }
}

export async function getCurrency(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const cur = await CurrencyService.getCurrency(companyID, id);
    if (!cur) return notFound(res, 'Currency not found');
    return ok(res, cur);
  } catch (err) {
    console.error('[CurrencyController] get error', err);
    return internal(res, err.message || 'Error fetching currency');
  }
}

export async function updateCurrency(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const payload = { ...req.body };
    const updated = await CurrencyService.updateCurrency(companyID, id, payload);
    return ok(res, updated);
  } catch (err) {
    console.error('[CurrencyController] update error', err);
    return internal(res, err.message || 'Error updating currency');
  }
}

export async function deleteCurrency(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const okDel = await CurrencyService.deleteCurrency(companyID, id);
    return ok(res, { deleted: okDel });
  } catch (err) {
    console.error('[CurrencyController] delete error', err);
    return internal(res, err.message || 'Error deleting currency');
  }
}

export async function addExchangeRate(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params; // currency id
    const payload = { ...req.body };
    const added = await CurrencyService.addExchangeRate(companyID, id, payload);
    return created(res, added);
  } catch (err) {
    console.error('[CurrencyController] addExchangeRate error', err);
    return internal(res, err.message || 'Error adding exchange rate');
  }
}

export async function deleteExchangeRate(req, res) {
  try {
    const { companyID } = req.auth;
    const { rateId } = req.params;
    const okDel = await CurrencyService.deleteExchangeRate(companyID, rateId);
    return ok(res, { deleted: okDel });
  } catch (err) {
    console.error('[CurrencyController] deleteExchangeRate error', err);
    return internal(res, err.message || 'Error deleting exchange rate');
  }
}

export default {
  listCurrencies,
  createCurrency,
  getCurrency,
  updateCurrency,
  deleteCurrency,
  addExchangeRate,
  deleteExchangeRate,
};
