import { Router } from 'express';
import CategoriesController from './Categories.controller.js';

const router = Router();

// Units of measure endpoints (placed before dynamic :category_id)
router.get('/', CategoriesController.listUOMs);
router.post('/', CategoriesController.createUOM);
router.get('/:id', CategoriesController.getUOM);
router.put('/:id', CategoriesController.updateUOM);
router.delete('/:id', CategoriesController.deleteUOM);



export default router;

