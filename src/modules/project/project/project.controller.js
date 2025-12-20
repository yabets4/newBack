
import ProjectService from './project.service.js';
import { ok, notFound, created, badRequest, noContent } from '../../../utils/apiResponse.js';

const service = ProjectService;

export default class ProjectController {
  // GET /projects
  static async getAll(req, res, next) {
    try {
      const prefix = req.auth.companyID;
      const projects = await service.list(prefix);
      return ok(res, projects);
    } catch (e) {
      next(e);
    }
  }

  // GET /projects/get-info
  static async getInfo(req, res, next) {
    try {
      const prefix = req.auth.companyID;
      const info = await service.getInfo(prefix);
      return ok(res, info);
    } catch (e) {
      next(e);
    }
  }

  // GET /projects/:id
  static async getById(req, res, next) {
    try {
      const prefix = req.auth.companyID;
      const project = await service.get(prefix, req.params.id);
      if (!project) return notFound(res, 'Project not found');
      return ok(res, project);
    } catch (e) {
      next(e);
    }
  }

  // POST /projects
  static async create(req, res, next) {
    try {
      const prefix = req.auth.companyID;
      // If files were uploaded via multipart/form-data, attach their metadata
      const files = req.files || [];
      const payload = { ...(req.body || {}) };
      if (files.length) {
        payload.uploadedFiles = files.map(f => ({ file_name: f.originalname, file_url: f.path, storage_name: f.filename }));
      }
      const project = await service.create(prefix, payload);
      return created(res, project);
    } catch (e) {
      next(e);
    }
  }

  // PUT /projects/:id
  static async update(req, res, next) {
    try {
      const prefix = req.auth.companyID;
      const files = req.files || [];
      const payload = { ...(req.body || {}) };
      if (files.length) {
        payload.uploadedFiles = files.map(f => ({ file_name: f.originalname, file_url: f.path, storage_name: f.filename }));
      }
      const project = await service.update(prefix, req.params.id, payload);
      if (!project) return notFound(res, 'Project not found');
      return ok(res, project);
    } catch (e) {
      next(e);
    }
  }

  // DELETE /projects/:id
  static async delete(req, res, next) {
    try {
      const prefix = req.auth.companyID;
      const success = await service.remove(prefix, req.params.id);
      if (!success) return notFound(res, 'Project not found');
      return ok(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }
}
