import { Router } from 'express';
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from './suppliers.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['inventory.suppliers.read.all', 'inventory.read.all']);
const canCreate = permission(['inventory.suppliers.create', 'inventory.create']);
const canUpdate = permission(['inventory.suppliers.update', 'inventory.update']);
const canDelete = permission(['inventory.suppliers.delete', 'inventory.delete']);

r.get('/', canRead, getSuppliers);
r.get('/:id', canRead, getSupplier);
r.post('/', canCreate, createSupplier);
r.put('/:id', canUpdate, updateSupplier);
r.delete('/:id', canDelete, deleteSupplier);

export default r;
