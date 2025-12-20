import { Router } from 'express';
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from './suppliers.controller.js';

const r = Router();

r.get('/', getSuppliers);
r.get('/:id', getSupplier);
r.post('/', createSupplier);
r.put('/:id', updateSupplier);
r.delete('/:id', deleteSupplier);

export default r;
