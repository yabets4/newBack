import MaintenanceModel from './maintenance.model.js';

const MaintenanceService = {
  async createMaintenance(company_id, payload) {
    // payload expected keys: maintenance_type, related_type, related_id, maintenance_date, description, cost, performed_by, notes
    const data = {
      company_id,
      maintenance_type: payload.maintenance_type || payload.type || 'General',
      related_type: payload.related_type || payload.relatedType || 'fixed_asset',
      related_id: payload.related_id || payload.relatedId || null,
      maintenance_date: payload.maintenance_date || payload.date || null,
      description: payload.description || null,
      cost: payload.cost != null ? Number(payload.cost) : 0,
      performed_by: payload.performed_by || payload.performedBy || null,
      notes: payload.notes || payload.note || null,
    };

    const created = await MaintenanceModel.create(data);
    return created;
  },

  async getMaintenance(company_id, id) {
    return await MaintenanceModel.findById(company_id, id);
  },

  async listMaintenance(company_id, filters) {
    const mappedFilters = {
      related_type: filters.related_type || filters.relatedType,
      related_id: filters.related_id || filters.relatedId,
      limit: filters.limit,
      offset: filters.offset,
    };
    return await MaintenanceModel.findAll(company_id, mappedFilters);
  },

  async deleteMaintenance(company_id, id) {
    return await MaintenanceModel.remove(company_id, id);
  }
};

export default MaintenanceService;
