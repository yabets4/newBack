import MaintenanceService from './maintenance.service.js';

const MaintenanceController = {
  // Create maintenance record
  create: async (req, res) => {
    try {
      const { companyID } = req.auth || {};
      if (!companyID) return res.status(401).json({ message: 'Unauthorized' });

      const payload = { ...req.body };
      // Parse numeric fields if provided as strings
      if (payload.cost) payload.cost = Number(payload.cost);

      const created = await MaintenanceService.createMaintenance(companyID, payload);
      res.status(201).json(created);
    } catch (err) {
      console.error('Error creating maintenance record:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // List maintenance records (supports query params: relatedType, relatedId, limit, offset)
  list: async (req, res) => {
    try {
      const { companyID } = req.auth || {};
      if (!companyID) return res.status(401).json({ message: 'Unauthorized' });

      const filters = {
        related_type: req.query.relatedType || req.query.related_type,
        related_id: req.query.relatedId || req.query.related_id,
        limit: req.query.limit,
        offset: req.query.offset,
      };

      const rows = await MaintenanceService.listMaintenance(companyID, filters);
      res.status(200).json(rows);
    } catch (err) {
      console.error('Error listing maintenance records:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get single maintenance record
  getById: async (req, res) => {
    try {
      const { companyID } = req.auth || {};
      if (!companyID) return res.status(401).json({ message: 'Unauthorized' });
      const { id } = req.params;
      const row = await MaintenanceService.getMaintenance(companyID, id);
      if (!row) return res.status(404).json({ message: 'Not found' });
      res.status(200).json(row);
    } catch (err) {
      console.error('Error fetching maintenance record:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Delete maintenance record
  delete: async (req, res) => {
    try {
      const { companyID } = req.auth || {};
      if (!companyID) return res.status(401).json({ message: 'Unauthorized' });
      const { id } = req.params;
      const deleted = await MaintenanceService.deleteMaintenance(companyID, id);
      if (!deleted) return res.status(404).json({ message: 'Not found' });
      res.status(200).json({ message: 'Deleted' });
    } catch (err) {
      console.error('Error deleting maintenance record:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export default MaintenanceController;
