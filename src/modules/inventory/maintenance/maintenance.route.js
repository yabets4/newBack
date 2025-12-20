import { Router } from 'express';
import MaintenanceController from './maintenance.controller.js';

const router = Router();

// POST /api/inventory/maintenance
router.post('/', MaintenanceController.create);

// GET /api/inventory/maintenance?relatedType=fixed_asset&relatedId=FA001
router.get('/', MaintenanceController.list);
router.get('/:id', MaintenanceController.getById);
router.delete('/:id', MaintenanceController.delete);

export default router;
