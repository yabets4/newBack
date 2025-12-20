import OffboardingService from './offboarding.service.js';
import { ok, created, notFound, badRequest } from '../../../utils/apiResponse.js';

const service = new OffboardingService();

export default class OffboardingController {
  static async listTemplates(req, res, next) {
    try { const companyId = req.auth.companyID; const rows = await service.listTemplates(companyId); return ok(res, rows); } catch (e) { next(e); }
  }

  static async getTemplate(req, res, next) {
    try { const companyId = req.auth.companyID; const rec = await service.getTemplate(companyId, req.params.id); if (!rec) return notFound(res,'Template not found'); return ok(res, rec); } catch(e){ next(e); }
  }

  static async createTemplate(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const data = { ...req.body };
      // Coerce tasks if sent as a string (e.g., from form data)
      if (typeof data.tasks === 'string') {
        try { data.tasks = JSON.parse(data.tasks); } catch (err) { return badRequest(res, 'Invalid JSON for tasks'); }
      }
      const createdRec = await service.createTemplate(companyId, data);
      return created(res, createdRec);
    } catch (e) { next(e); }
  }

  static async updateTemplate(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const data = { ...req.body };
      if (typeof data.tasks === 'string') {
        try { data.tasks = JSON.parse(data.tasks); } catch (err) { return badRequest(res, 'Invalid JSON for tasks'); }
      }
      const updated = await service.updateTemplate(companyId, req.params.id, data);
      if (!updated) return notFound(res, 'Template not found');
      return ok(res, updated);
    } catch (e) { next(e); }
  }

  static async deleteTemplate(req, res, next) {
    try { const companyId = req.auth.companyID; await service.deleteTemplate(companyId, req.params.id); return ok(res, { message: 'Deleted' }); } catch (e) { next(e); }
  }

  static async listProcesses(req, res, next) {
    try { const companyId = req.auth.companyID; const opts = { employee_id: req.query.employee_id, status: req.query.status }; const rows = await service.listProcesses(companyId, opts); return ok(res, rows); } catch (e) { next(e); }
  }

  static async getProcess(req, res, next) {
    try { const companyId = req.auth.companyID; const rec = await service.getProcess(companyId, req.params.id); if (!rec) return notFound(res,'Process not found'); return ok(res, rec); } catch (e) { next(e); }
  }

  static async createProcess(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const data = { ...req.body };
      if (typeof data.tasks === 'string') {
        try { data.tasks = JSON.parse(data.tasks); } catch (err) { return badRequest(res, 'Invalid JSON for tasks'); }
      }
      const createdRec = await service.createProcess(companyId, data);
      return created(res, createdRec);
    } catch (e) { next(e); }
  }

  static async updateProcess(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const data = { ...req.body };
      if (typeof data.tasks === 'string') {
        try { data.tasks = JSON.parse(data.tasks); } catch (err) { return badRequest(res, 'Invalid JSON for tasks'); }
      }
      const updated = await service.updateProcess(companyId, req.params.id, data);
      if (!updated) return notFound(res, 'Process not found');
      return ok(res, updated);
    } catch (e) { next(e); }
  }

  static async deleteProcess(req, res, next) {
    try { const companyId = req.auth.companyID; await service.deleteProcess(companyId, req.params.id); return ok(res, { message: 'Deleted' }); } catch (e) { next(e); }
  }

  static async updateTaskStatus(req, res, next) {
    try { const companyId = req.auth.companyID; const { id, taskId } = req.params; const { status } = req.body; if (!status) return badRequest(res,'Missing status'); const updated = await service.updateTaskStatus(companyId, id, taskId, status); if (!updated) return notFound(res,'Process or task not found'); return ok(res, updated); } catch (e) { next(e); }
  }
}
