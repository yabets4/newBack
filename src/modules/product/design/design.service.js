import DesignModel from './design.model.js';

export const DesignService = {
  async list(companyId) {
    return await DesignModel.findAll(companyId);
  },

  async get(companyId, id) {
    return await DesignModel.findById(companyId, id);
  },

  async create(companyId, data) {
    if (!data.design_name && !data.name) throw new Error('Design name is required');
    return await DesignModel.insert(companyId, data);
  },

  async update(companyId, id, data) {
    return await DesignModel.update(companyId, id, data);
  },

  async updateStatus(companyId, id, status, noteObj) {
    // basic validation
    if (!status) throw new Error('Status is required');
    return await DesignModel.updateStatusWithNote(companyId, id, status, noteObj);
  },

  async delete(companyId, id) {
    return await DesignModel.delete(companyId, id);
  }
};

export default DesignService;
