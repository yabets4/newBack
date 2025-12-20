import { Router } from 'express';
import {
	getFinishedProducts,
	getFinishedProduct,
	createFinishedProduct,
	updateFinishedProduct,
	deleteFinishedProduct,
	updateFinishedProductStatus
} from './finishedProduct.controller.js';
import { uploadProductImage } from '../../../middleware/multer.middleware.js';

const r = Router();

r.get('/', getFinishedProducts);
r.get('/:id', getFinishedProduct);

// status-only update
r.patch('/:id/status', updateFinishedProductStatus);

// accept multiple images under field name 'images'
r.post('/', uploadProductImage.array('images', 10), createFinishedProduct);
r.put('/:id', uploadProductImage.array('images', 10), updateFinishedProduct);
r.delete('/:id', deleteFinishedProduct);

export default r;

