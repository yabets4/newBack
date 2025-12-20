import { CoaService } from './coa.service.js';
import { ok, created, badRequest, notFound, internal } from '../../../utils/apiResponse.js';

// GET /coa
export async function getAccounts(req, res) {
  try {
    const { companyID } = req.auth;
    const accounts = await CoaService.getAccounts(companyID);
    return ok(res, accounts);
  } catch (err) {
    console.error('[CoaController] getAccounts error:', err);
    return internal(res, err.message || 'Error fetching accounts');
  }
}

// GET /coa/tree
export async function getAccountTree(req, res) {
  try {
    const { companyID } = req.auth;
    const tree = await CoaService.getAccountTree(companyID);
    return ok(res, tree);
  } catch (err) {
    console.error('[CoaController] getAccountTree error:', err);
    return internal(res, err.message || 'Error fetching account tree');
  }
}

// GET /coa/:id
export async function getAccount(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const accounts = await CoaService.getAccounts(companyID);
    const found = accounts.find(a => a.account_id === id || a.account_number === id);
    if (!found) return notFound(res, 'Account not found');
    return ok(res, found);
  } catch (err) {
    console.error('[CoaController] getAccount error:', err);
    return internal(res, err.message || 'Error fetching account');
  }
}

// POST /coa
export async function createAccount(req, res) {
  try {
    const { companyID } = req.auth;
    const payload = { ...req.body };
    const createdAccount = await CoaService.createAccount(companyID, payload);
    return created(res, createdAccount);
  } catch (err) {
    console.error('[CoaController] createAccount error:', err);
    return internal(res, err.message || 'Error creating account');
  }
}

// PUT /coa/:id
export async function updateAccount(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const payload = { ...req.body };
    const updated = await CoaService.updateAccount(companyID, id, payload);
    if (!updated) return notFound(res, 'Account not found');
    return ok(res, updated);
  } catch (err) {
    console.error('[CoaController] updateAccount error:', err);
    return internal(res, err.message || 'Error updating account');
  }
}

// DELETE /coa/:id
export async function deleteAccount(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const deleted = await CoaService.deleteAccount(companyID, id);
    if (!deleted) return notFound(res, 'Account not found');
    return ok(res, { message: 'Account deleted', deleted });
  } catch (err) {
    console.error('[CoaController] deleteAccount error:', err);
    return internal(res, err.message || 'Error deleting account');
  }
}

export default {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountTree,
};
