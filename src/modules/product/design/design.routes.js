import { Router } from 'express';
import {
  getDesigns,
  getDesign,
  createDesign,
  updateDesign,
  deleteDesign,
  updateDesignStatus
} from './design.controller.js';
import { uploadProductImage } from '../../../middleware/multer.middleware.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['product.designs.read.all', 'product.read.all']);
const canCreate = permission(['product.designs.create', 'product.create']);
const canUpdate = permission(['product.designs.update', 'product.update']);
const canDelete = permission(['product.designs.delete', 'product.delete']);

r.get('/', canRead, getDesigns);
r.get('/:id', canRead, getDesign);

// accept multiple design images under 'images'
r.post('/', canCreate, uploadProductImage.array('images', 10), createDesign);
r.put('/:id', canUpdate, uploadProductImage.array('images', 10), updateDesign);
r.delete('/:id', canDelete, deleteDesign);

// approval endpoint: update status and append reviewer note
r.patch('/:id/status', canUpdate, updateDesignStatus);

export default r;
