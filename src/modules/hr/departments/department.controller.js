import { DepartmentService } from './department.service.js';

// Assumes request has `companyId` available (middleware) or in params
export const DepartmentController = {
  async create(req, res, next) {
    try {
      const { companyID } = req.auth;
      const created = await DepartmentService.create(companyID, req.body);
      res.json({ success: true, data: created });
    } catch (err) { next(err); }
  },

  async list(req, res, next) {
    try {
      const { companyID } = req.auth;
      const list = await DepartmentService.list(companyID);
      res.json({ success: true, data: list });
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try {
      const { companyID } = req.auth;
      const departmentId = req.params.departmentId;
      const item = await DepartmentService.get(companyID, departmentId);
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const { companyID } = req.auth;
      const departmentId = req.params.departmentId;
      const updated = await DepartmentService.update(companyID, departmentId, req.body);
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      const { companyID } = req.auth;
      const departmentId = req.params.departmentId;
      const ok = await DepartmentService.remove(companyID, departmentId);
      res.json({ success: true, removed: ok });
    } catch (err) { next(err); }
  },

  // Jobs
  async createJob(req, res, next) {
    try {
      const { companyID } = req.auth;
      const departmentId = req.params.departmentId;
      const created = await DepartmentService.createJob(companyID, departmentId, req.body);
      res.json({ success: true, data: created });
    } catch (err) { next(err); }
  },

  async listJobs(req, res, next) {
    try {
      const { companyID } = req.auth;
      const departmentId = req.params.departmentId;
      const list = await DepartmentService.listJobs(companyID, departmentId);
      res.json({ success: true, data: list });
    } catch (err) { next(err); }
  },

  async getJob(req, res, next) {
    try {
      const { companyID } = req.auth;
      const departmentId = req.params.departmentId;
      const jobId = req.params.jobId;
      const item = await DepartmentService.getJob(companyID, departmentId, jobId);
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  async updateJob(req, res, next) {
    try {
      const { companyID } = req.auth;
      const departmentId = req.params.departmentId;
      const jobId = req.params.jobId;
      const updated = await DepartmentService.updateJob(companyID, departmentId, jobId, req.body);
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },

  async removeJob(req, res, next) {
    try {
      const { companyID } = req.auth;
      const departmentId = req.params.departmentId;
      const jobId = req.params.jobId;
      const ok = await DepartmentService.removeJob(companyID, departmentId, jobId);
      res.json({ success: true, removed: ok });
    } catch (err) { next(err); }
  }
};
