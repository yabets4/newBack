import AssignedToolModel from './assignedTool.model.js';

const AssignedToolService = {
  async create(companyId, payload) {
    // normalize payload if needed
    const rec = await AssignedToolModel.create(companyId, payload || {});
    return rec;
  },

  async update(companyId, id, payload) {
    const rec = await AssignedToolModel.update(companyId, id, payload || {});
    return rec;
  },

  async delete(companyId, id) {
    const deleted = await AssignedToolModel.delete(companyId, id);
    return deleted;
  },

  async getById(companyId, id) {
    return AssignedToolModel.getById(companyId, id);
  },

  async list(companyId, filters) {
    return AssignedToolModel.list(companyId, filters || {});
  }
};

export default AssignedToolService;
