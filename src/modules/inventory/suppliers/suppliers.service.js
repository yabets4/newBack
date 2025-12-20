import { SuppliersModel } from './suppliers.model.js';

export const SuppliersService = {
  async list(companyId) {
    return await SuppliersModel.findAll(companyId);
  },

  async get(companyId, supplierId) {
    return await SuppliersModel.findById(companyId, supplierId);
  },

  async create(companyId, data) {
    if (!data || !data.name) throw new Error('Missing required field: name');
    // Coerce latitude/longitude to numbers when provided
    const payload = { ...data };
    if (payload.latitude !== undefined && payload.latitude !== null && payload.latitude !== '') {
      const lat = Number(payload.latitude);
      if (Number.isNaN(lat)) throw new Error('Invalid latitude');
      payload.latitude = lat;
    } else {
      payload.latitude = null;
    }
    if (payload.longitude !== undefined && payload.longitude !== null && payload.longitude !== '') {
      const lng = Number(payload.longitude);
      if (Number.isNaN(lng)) throw new Error('Invalid longitude');
      payload.longitude = lng;
    } else {
      payload.longitude = null;
    }

    return await SuppliersModel.insert(companyId, payload);
  },

  async update(companyId, supplierId, data) {
    const payload = { ...data };
    if (payload.latitude !== undefined && payload.latitude !== null && payload.latitude !== '') {
      const lat = Number(payload.latitude);
      if (Number.isNaN(lat)) throw new Error('Invalid latitude');
      payload.latitude = lat;
    } else {
      payload.latitude = null;
    }
    if (payload.longitude !== undefined && payload.longitude !== null && payload.longitude !== '') {
      const lng = Number(payload.longitude);
      if (Number.isNaN(lng)) throw new Error('Invalid longitude');
      payload.longitude = lng;
    } else {
      payload.longitude = null;
    }

    const updated = await SuppliersModel.update(companyId, supplierId, payload);
    if (!updated) throw new Error('Supplier not found');
    return updated;
  },

  async delete(companyId, supplierId) {
    const ok = await SuppliersModel.delete(companyId, supplierId);
    if (!ok) throw new Error('Supplier not found');
    return true;
  }
};

export default SuppliersService;
