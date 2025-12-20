import { ProjectModel } from './project.model.js';

export default {
  async list(companyId) {
    return await ProjectModel.findAll(companyId);
  },
  async get(companyId, projectId) {
    return await ProjectModel.findById(companyId, projectId);
  },
  async create(companyId, data) {
    return await ProjectModel.create(companyId, data);
  },
  async update(companyId, projectId, data) {
    return await ProjectModel.update(companyId, projectId, data);
  },
  async remove(companyId, projectId) {
    return await ProjectModel.remove(companyId, projectId);
  },
  async getInfo(companyId) {
    return await ProjectModel.getInfo(companyId);
  },
};
