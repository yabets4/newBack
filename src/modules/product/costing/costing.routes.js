import { Router } from 'express';
import CostingController from './costing.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['product.costing.read.all', 'product.read.all']);
const canCreate = permission(['product.costing.create', 'product.create']);
const canUpdate = permission(['product.costing.update', 'product.update']);
const canDelete = permission(['product.costing.delete', 'product.delete']);

r.get('/', canRead, CostingController.listRules);
r.get('/:id', canRead, CostingController.getRule);
r.post('/', canCreate, CostingController.createRule);
r.put('/:id', canUpdate, CostingController.updateRule);
r.delete('/:id', canDelete, CostingController.deleteRule);

export default r;
