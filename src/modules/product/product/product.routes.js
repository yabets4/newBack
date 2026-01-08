import { Router } from 'express';
import {
	getProducts,
	getProduct,
	getCustomizableProducts,
	createProduct,
	updateProduct,
	deleteProduct,
	updateProductStatus
} from './product.controller.js';
import { uploadProductImage } from '../../../middleware/multer.middleware.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['product.products.read.all', 'product.read.all']);
const canCreate = permission(['product.products.create', 'product.create']);
const canUpdate = permission(['product.products.update', 'product.update']);
const canDelete = permission(['product.products.delete', 'product.delete']);

r.get('/', canRead, getProducts);
// customizable products list
r.get('/customizable', canRead, getCustomizableProducts);
r.get('/:id', canRead, getProduct);

// status-only update
r.patch('/:id/status', canUpdate, updateProductStatus);

// accept multiple product images under field name 'images'
r.post('/', canCreate, uploadProductImage.array('images', 10), createProduct);
r.put('/:id', canUpdate, uploadProductImage.array('images', 10), updateProduct);
r.delete('/:id', canDelete, deleteProduct);

export default r;
