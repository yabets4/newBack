import { Router } from 'express';
import ToolsController from './tools.controller.js';
import { uploadToolImage } from '../../../middleware/multer.middleware.js';

import permission from '../../../middleware/permission.middleware.js';

const router = Router();

const canRead = permission(['inventory.tools.read.all', 'inventory.read.all']);
const canCreate = permission(['inventory.tools.create', 'inventory.create']);
const canUpdate = permission(['inventory.tools.update', 'inventory.update']);
const canDelete = permission(['inventory.tools.delete', 'inventory.delete']);

router.post('/', canCreate, uploadToolImage.single('image'), ToolsController.create);
router.get('/', canRead, ToolsController.getAll);
router.get('/lookup', canRead, ToolsController.getData);
router.get('/:id', canRead, ToolsController.getById);
router.put('/:id', canUpdate, uploadToolImage.single('image'), ToolsController.update);
router.delete('/:id', canDelete, ToolsController.delete);

export default router;
