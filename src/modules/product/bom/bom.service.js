import { BOMModel } from './bom.model.js';

export const BOMService = {
  async list(companyId) {
    return await BOMModel.findAll(companyId);
  },

  async get(companyId, bomId) {
    return await BOMModel.findById(companyId, bomId);
  },

  async create(companyId, data) {
    const required = ['name'];
    const missing = required.filter(f => !data[f]);
    if (missing.length) throw new Error(`Missing required fields: ${missing.join(', ')}`);
    return await BOMModel.insert(companyId, data);
  },

  async update(companyId, bomId, data) {
    return await BOMModel.update(companyId, bomId, data);
  },

  async delete(companyId, bomId) {
    const deleted = await BOMModel.delete(companyId, bomId);
    if (!deleted) throw new Error('BOM not found');
    return true;
  }
};
