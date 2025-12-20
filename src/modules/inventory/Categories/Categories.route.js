import { Router } from 'express';
import CategoriesController from './Categories.controller.js';

const router = Router();


// Categories endpoints (root of this router assumed to be mounted as /categories)
router.get('/', CategoriesController.listCategories);
router.post('/', CategoriesController.createCategory);
router.get('/:id', CategoriesController.getCategory);
router.put('/:id', CategoriesController.updateCategory);
router.delete('/:id', CategoriesController.deleteCategory);

export default router;

