import AssignedToolService from './assignedTool.service.js';
import { ok, notFound } from '../../../utils/apiResponse.js';

const service = new AssignedToolService();

export default class AssignedToolController {
  // GET /assigned-tools
  static async getAll(req, res, next) {
    try {
      const prefix = req.tenantPrefix;
      const tools = await service.getAllTools(prefix, req.query);
      return ok(res, tools);
    } catch (e) {
      next(e);
    }
  }

  // GET /assigned-tools/:id
  static async getById(req, res, next) {
    try {
      const prefix = req.tenantPrefix;
      const tool = await service.getToolById(prefix, req.params.id);
      if (!tool) return notFound(res, 'Assigned tool not found');
      return ok(res, tool);
    } catch (e) {
      next(e);
    }
  }

  // POST /assigned-tools
  static async create(req, res, next) {
    try {
      const prefix = req.tenantPrefix;
      const tool = await service.createTool(prefix, req.body);
      return ok(res, tool);
    } catch (e) {
      next(e);
    }
  }

  // PUT /assigned-tools/:id
  static async update(req, res, next) {
    try {
      const prefix = req.tenantPrefix;
      const tool = await service.updateTool(prefix, req.params.id, req.body);
      if (!tool) return notFound(res, 'Assigned tool not found');
      return ok(res, tool);
    } catch (e) {
      next(e);
    }
  }

  // DELETE /assigned-tools/:id
  static async delete(req, res, next) {
    try {
      const prefix = req.tenantPrefix;
      const success = await service.deleteTool(prefix, req.params.id);
      if (!success) return notFound(res, 'Assigned tool not found');
      return ok(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }
}
