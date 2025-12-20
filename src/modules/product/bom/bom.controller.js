import { BOMService } from './bom.service.js';
import { ok, created, badRequest, notFound } from '../../../utils/apiResponse.js';

export async function getBOMs(req, res) {
  try {
    const { companyID } = req.auth;
    const boms = await BOMService.list(companyID);
    return ok(res, boms);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function getBOM(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const bom = await BOMService.get(companyID, id);
    if (!bom) return notFound(res, 'BOM not found');
    return ok(res, bom);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function createBOM(req, res) {
  try {
    const { companyID } = req.auth;
    let data = { ...req.body };
    // allow client to pass components as JSON string
    if (typeof data.components === 'string') {
      try { data.components = JSON.parse(data.components); } catch (e) { /* ignore */ }
    }
    const createdBOM = await BOMService.create(companyID, data);
    return created(res, createdBOM);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function updateBOM(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    let data = { ...req.body };
    if (typeof data.components === 'string') {
      try { data.components = JSON.parse(data.components); } catch (e) { /* ignore */ }
    }
    const updated = await BOMService.update(companyID, id, data);
    return ok(res, updated);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function deleteBOM(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    await BOMService.delete(companyID, id);
    return ok(res, { message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export default {
  getBOMs,
  getBOM,
  createBOM,
  updateBOM,
  deleteBOM
};
