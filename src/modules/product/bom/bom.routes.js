import { Router } from 'express';
import { getBOMs, getBOM, createBOM, updateBOM, deleteBOM } from './bom.controller.js';
import { getRules, getRule, createRule, updateRule, deleteRule } from './bom.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['product.boms.read.all', 'product.read.all']);
const canCreate = permission(['product.boms.create', 'product.create']);
const canUpdate = permission(['product.boms.update', 'product.update']);
const canDelete = permission(['product.boms.delete', 'product.delete']);

r.get('/', canRead, getBOMs);
r.get('/:id', canRead, getBOM);
r.post('/', canCreate, createBOM);
r.put('/:id', canUpdate, updateBOM);
r.delete('/:id', canDelete, deleteBOM);

// Dynamic BOM rules
r.get('/rules', canRead, getRules);
r.get('/rules/:id', canRead, getRule);
r.post('/rules', canCreate, createRule);
r.put('/rules/:id', canUpdate, updateRule);
r.delete('/rules/:id', canDelete, deleteRule);

export default r;
