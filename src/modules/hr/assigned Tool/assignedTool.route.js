import { Router } from 'express';
import AssignedToolController from './assignedTool.controller.js';

import permission from '../../../middleware/permission.middleware.js'; // Adjust path based on weird folder name or standard ../../../

const router = Router();

const canRead = permission(['hr.tools.read.all', 'hr.read.all']);
const canCreate = permission(['hr.tools.create', 'hr.create']);
const canUpdate = permission(['hr.tools.update', 'hr.update']);
const canDelete = permission(['hr.tools.delete', 'hr.delete']);

router.get('/', canRead, AssignedToolController.getAll);
router.get('/:id', canRead, AssignedToolController.getById);
router.post('/', canCreate, AssignedToolController.create);
router.put('/:id', canUpdate, AssignedToolController.update);
router.delete('/:id', canDelete, AssignedToolController.delete);

export default router;
