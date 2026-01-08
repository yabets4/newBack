import { Router } from 'express';
import AdvancedController from './advanced.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['product.advanced.read.all', 'product.read.all']);
const canCreate = permission(['product.advanced.create', 'product.create']);
const canUpdate = permission(['product.advanced.update', 'product.update']);
const canDelete = permission(['product.advanced.delete', 'product.delete']);

// Nesting Jobs
r.get('/nesting/jobs', canRead, AdvancedController.listJobs);
r.post('/nesting/jobs', canCreate, AdvancedController.createJob);
r.put('/nesting/jobs/:jobId/status', canUpdate, AdvancedController.updateJobStatus);

// Nesting Layouts
r.get('/nesting/jobs/:jobId/layouts', canRead, AdvancedController.listLayoutsByJob);
r.post('/nesting/layouts', canCreate, AdvancedController.createLayout);
r.put('/nesting/layouts/:layoutId/status', canUpdate, AdvancedController.updateLayoutStatus);

// Offcuts
r.get('/offcuts', canRead, AdvancedController.listOffcuts);
r.post('/offcuts', canCreate, AdvancedController.createOffcut);
r.put('/offcuts/:offcutId', canUpdate, AdvancedController.updateOffcut);
r.delete('/offcuts/:offcutId', canDelete, AdvancedController.deleteOffcut);

// Nesting Reference Data
r.get('/nesting/materials', canRead, AdvancedController.listMaterials);
r.get('/nesting/parts', canRead, AdvancedController.listParts);

export default r;
