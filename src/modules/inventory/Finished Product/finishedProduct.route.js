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

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['inventory.finished_products.read.all', 'inventory.read.all']);
const canCreate = permission(['inventory.finished_products.create', 'inventory.create']);
const canUpdate = permission(['inventory.finished_products.update', 'inventory.update']);
const canDelete = permission(['inventory.finished_products.delete', 'inventory.delete']);

r.get('/', canRead, getFinishedProducts);
r.get('/:id', canRead, getFinishedProduct);

// status-only update
r.patch('/:id/status', canUpdate, updateFinishedProductStatus);

// accept multiple images under field name 'images'
r.post('/', canCreate, uploadProductImage.array('images', 10), createFinishedProduct);
r.put('/:id', canUpdate, uploadProductImage.array('images', 10), updateFinishedProduct);
r.delete('/:id', canDelete, deleteFinishedProduct);

export default r;

