import { Router } from 'express';
import {
  getDesigns,
  getDesign,
  createDesign,
  updateDesign,
  deleteDesign
} from './design.controller.js';
import { updateDesignStatus } from './design.controller.js';
import { uploadProductImage } from '../../../middleware/multer.middleware.js';

const r = Router();

r.get('/', getDesigns);
r.get('/:id', getDesign);

// accept multiple design images under 'images'
r.post('/', uploadProductImage.array('images', 10), createDesign);
r.put('/:id', uploadProductImage.array('images', 10), updateDesign);
r.delete('/:id', deleteDesign);

// approval endpoint: update status and append reviewer note
r.patch('/:id/status', updateDesignStatus);

export default r;
