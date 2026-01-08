import { Router } from 'express';
import CategoriesController from './Categories.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const router = Router();

const canRead = permission(['inventory.categories.read.all', 'inventory.read.all']);
const canCreate = permission(['inventory.categories.create', 'inventory.create']);
const canUpdate = permission(['inventory.categories.update', 'inventory.update']);
const canDelete = permission(['inventory.categories.delete', 'inventory.delete']);

// Categories endpoints (root of this router assumed to be mounted as /categories)
router.get('/', canRead, CategoriesController.listCategories);
router.post('/', canCreate, CategoriesController.createCategory);
router.get('/:id', canRead, CategoriesController.getCategory);
router.put('/:id', canUpdate, CategoriesController.updateCategory);
router.delete('/:id', canDelete, CategoriesController.deleteCategory);

export default router;

