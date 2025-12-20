import { Router } from 'express';
import {
	getProducts,
	getProduct,
	createProduct,
	updateProduct,
	deleteProduct,
	updateProductStatus
} from './product.controller.js';
import { uploadProductImage } from '../../../middleware/multer.middleware.js';

const r = Router();

r.get('/', getProducts);
r.get('/:id', getProduct);

// status-only update
r.patch('/:id/status', updateProductStatus);

// accept multiple product images under field name 'images'
r.post('/', uploadProductImage.array('images', 10), createProduct);
r.put('/:id', uploadProductImage.array('images', 10), updateProduct);
r.delete('/:id', deleteProduct);

export default r;
