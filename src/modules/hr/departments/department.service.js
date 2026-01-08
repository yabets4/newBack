import { DepartmentModel } from './department.model.js';

export const DepartmentService = {
  async create(companyId, payload) {
    // ensure department_id provided or generate
    const departmentId = payload.department_id || `DEPT-${Date.now().toString().slice(-6)}`;
    return DepartmentModel.create(companyId, { ...payload, department_id: departmentId });
  },

  async list(companyId) {
    return DepartmentModel.findAll(companyId);
  },

  async get(companyId, departmentId) {
    return DepartmentModel.findById(companyId, departmentId);
  },

  async update(companyId, departmentId, payload) {
    return DepartmentModel.update(companyId, departmentId, payload);
  },

  async remove(companyId, departmentId) {
    return DepartmentModel.remove(companyId, departmentId);
  },

  // Jobs
  async createJob(companyId, departmentId, payload) {
    const jobId = payload.job_id || `JOB-${Date.now().toString().slice(-6)}`;
    return DepartmentModel.createJob(companyId, departmentId, { ...payload, job_id: jobId });
  },

  async listJobs(companyId, departmentId) {
    return DepartmentModel.findJobs(companyId, departmentId);
  },

  async getJob(companyId, departmentId, jobId) {
    return DepartmentModel.findJobById(companyId, departmentId, jobId);
  },

  async updateJob(companyId, departmentId, jobId, payload) {
    return DepartmentModel.updateJob(companyId, departmentId, jobId, payload);
  },

  async removeJob(companyId, departmentId, jobId) {
    return DepartmentModel.removeJob(companyId, departmentId, jobId);
  },

  // Job Levels
  async createJobLevel(companyId, departmentId, jobId, payload) {
    const levelId = payload.level_id || `LVL-${Date.now().toString().slice(-6)}`;
    return DepartmentModel.createJobLevel(companyId, departmentId, jobId, { ...payload, level_id: levelId });
  },

  async listJobLevels(companyId, departmentId, jobId) {
    return DepartmentModel.findJobLevels(companyId, departmentId, jobId);
  },

  async getJobLevel(companyId, departmentId, jobId, levelId) {
    return DepartmentModel.findJobLevelById(companyId, departmentId, jobId, levelId);
  },

  async updateJobLevel(companyId, departmentId, jobId, levelId, payload) {
    return DepartmentModel.updateJobLevel(companyId, departmentId, jobId, levelId, payload);
  },

  async removeJobLevel(companyId, departmentId, jobId, levelId) {
    return DepartmentModel.removeJobLevel(companyId, departmentId, jobId, levelId);
  },

  async getJobWithLevels(companyId, departmentId, jobId) {
    return DepartmentModel.findJobWithLevels(companyId, departmentId, jobId);
  },

  async listJobsWithLevels(companyId, departmentId) {
    return DepartmentModel.findJobsWithLevels(companyId, departmentId);
  }
};
