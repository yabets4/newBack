import TaskService from './task.service.js';
import { ok, created, notFound } from '../../../utils/apiResponse.js';

const service = TaskService;

export default class TaskController {
  // GET /projects/:projectId/tasks
  static async list(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const { projectId } = req.params;
      const tasks = await service.list(companyId, projectId);
      return ok(res, tasks);
    } catch (e) {
      next(e);
    }
  }

  // GET /projects/:projectId/tasks/:taskId
  static async get(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const { projectId, taskId } = req.params;
      const task = await service.get(companyId, projectId, taskId);
      if (!task) return notFound(res, 'Task not found');
      return ok(res, task);
    } catch (e) {
      next(e);
    }
  }

  // POST /projects/:projectId/tasks
  static async create(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const { projectId } = req.params;
      const payload = { ...(req.body || {}) };
      const task = await service.create(companyId, projectId, payload);
      return created(res, task);
    } catch (e) {
      next(e);
    }
  }

  // PUT /projects/:projectId/tasks/:taskId
  static async update(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const { projectId, taskId } = req.params;
      const payload = { ...(req.body || {}) };
      const task = await service.update(companyId, projectId, taskId, payload);
      if (!task) return notFound(res, 'Task not found');
      return ok(res, task);
    } catch (e) {
      next(e);
    }
  }

  // DELETE /projects/:projectId/tasks/:taskId
  static async delete(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const { projectId, taskId } = req.params;
      const success = await service.remove(companyId, projectId, taskId);
      if (!success) return notFound(res, 'Task not found');
      return ok(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }
}
