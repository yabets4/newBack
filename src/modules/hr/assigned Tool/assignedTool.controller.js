import { ok, created, internal, badRequest, notFound } from '../../../utils/apiResponse.js';
import AssignedToolService from './assignedTool.service.js';

export async function getAll(req, res) {
  try {
    const { companyID } = req.auth;
    const filters = {};
    if (req.query.employee_id) filters.employee_id = req.query.employee_id;
    const rows = await AssignedToolService.list(companyID, filters);
    return ok(res, rows);
  } catch (err) {
    console.error('[AssignedToolController] getAll error:', err);
    return internal(res, 'Error fetching assigned tools');
  }
}

export async function getById(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const row = await AssignedToolService.getById(companyID, id);
    if (!row) return notFound(res, 'Assigned tool not found');
    return ok(res, row);
  } catch (err) {
    console.error('[AssignedToolController] getById error:', err);
    return internal(res, 'Error fetching assigned tool');
  }
}

export async function create(req, res) {
  try {
    const { companyID } = req.auth;
    const payload = req.body || {};
    const rec = await AssignedToolService.create(companyID, payload);
    return created(res, rec);
  } catch (err) {
    console.error('[AssignedToolController] create error:', err);
    return internal(res, err.message || 'Error creating assigned tool');
  }
}

export async function update(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const payload = req.body || {};
    const updated = await AssignedToolService.update(companyID, id, payload);
    if (!updated) return notFound(res, 'Assigned tool not found');
    return ok(res, updated);
  } catch (err) {
    console.error('[AssignedToolController] update error:', err);
    return internal(res, err.message || 'Error updating assigned tool');
  }
}

export async function remove(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const deleted = await AssignedToolService.delete(companyID, id);
    if (!deleted) return notFound(res, 'Assigned tool not found');
    return ok(res, { message: 'Deleted' });
  } catch (err) {
    console.error('[AssignedToolController] delete error:', err);
    return internal(res, 'Error deleting assigned tool');
  }
}

export default { getAll, getById, create, update, delete: remove };
