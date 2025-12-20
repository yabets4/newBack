import { Router } from 'express';
import ToolsController from './tools.controller.js';
import { uploadToolImage } from '../../../middleware/multer.middleware.js';

const router = Router();

router.post('/', uploadToolImage.single('image'), ToolsController.create);
router.get('/', ToolsController.getAll);
router.get('/lookup', ToolsController.getData);
router.get('/:id', ToolsController.getById);
router.put('/:id', uploadToolImage.single('image'), ToolsController.update);
router.delete('/:id', ToolsController.delete);

export default router;
