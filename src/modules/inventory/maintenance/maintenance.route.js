import { Router } from 'express';
import MaintenanceController from './maintenance.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const router = Router();

const canRead = permission(['inventory.maintenance.read.all', 'inventory.read.all']);
const canCreate = permission(['inventory.maintenance.create', 'inventory.create']);
const canDelete = permission(['inventory.maintenance.delete', 'inventory.delete']);

// POST /api/inventory/maintenance
router.post('/', canCreate, MaintenanceController.create);

// GET /api/inventory/maintenance?relatedType=fixed_asset&relatedId=FA001
router.get('/', canRead, MaintenanceController.list);
router.get('/:id', canRead, MaintenanceController.getById);
router.delete('/:id', canDelete, MaintenanceController.delete);

export default router;
