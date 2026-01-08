import { BOMService } from './bom.service.js';
import { ok, created, badRequest, notFound } from '../../../utils/apiResponse.js';

export async function getBOMs(req, res) {
  try {
    const { companyID } = req.auth;
    const { productId } = req.query;
    const boms = await BOMService.list(companyID, productId);
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

export async function getRules(req, res) {
  try {
    const { companyID } = req.auth;
    const { productId } = req.query;
    const rules = await BOMService.listRules(companyID, productId);
    return ok(res, rules);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function getRule(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const rule = await BOMService.getRule(companyID, id);
    if (!rule) return notFound(res, 'Rule not found');
    return ok(res, rule);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function createRule(req, res) {
  try {
    const { companyID } = req.auth;
    const data = { ...req.body };
    const createdRule = await BOMService.createRule(companyID, data);
    return created(res, createdRule);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function updateRule(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const data = { ...req.body };
    const updated = await BOMService.updateRule(companyID, id, data);
    return ok(res, updated);
  } catch (err) {
    console.error(err);
    return badRequest(res, err.message);
  }
}

export async function deleteRule(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const deleted = await BOMService.deleteRule(companyID, id);
    if (!deleted) return notFound(res, 'Rule not found');
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
