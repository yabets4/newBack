import TaskModel from './task.model.js';

export default {
  async list(companyId, projectId) {
    return await TaskModel.findAll(companyId, projectId);
  },
  async get(companyId, projectId, taskId) {
    return await TaskModel.findById(companyId, projectId, taskId);
  },
  async create(companyId, projectId, data) {
    return await TaskModel.create(companyId, projectId, data);
  },
  async update(companyId, projectId, taskId, data) {
    return await TaskModel.update(companyId, projectId, taskId, data);
  },
  async remove(companyId, projectId, taskId) {
    return await TaskModel.remove(companyId, projectId, taskId);
  }
};
