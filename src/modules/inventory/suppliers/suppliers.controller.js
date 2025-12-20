import { SuppliersService } from './suppliers.service.js';
import { ok, badRequest, notFound } from '../../../utils/apiResponse.js';

export async function getSuppliers(req, res) {
  try {
    const { companyID } = req.auth;
    const rows = await SuppliersService.list(companyID);
    return ok(res, rows);
  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}

export async function getSupplier(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const row = await SuppliersService.get(companyID, id);
    if (!row) return notFound(res, 'Supplier not found');
    return ok(res, row);
  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}

export async function createSupplier(req, res) {
  try {
    const { companyID } = req.auth;
    const data = { ...req.body };
    const created = await SuppliersService.create(companyID, data);
    return ok(res, created);
  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}

export async function updateSupplier(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const data = { ...req.body };
    const updated = await SuppliersService.update(companyID, id, data);
    return ok(res, updated);
  } catch (err) {
    console.log(err);
    if (err.message && err.message.includes('not found')) return notFound(res, err.message);
    return badRequest(res, err.message);
  }
}

export async function deleteSupplier(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    await SuppliersService.delete(companyID, id);
    return ok(res, { message: 'Deleted successfully' });
  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}

export default {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
