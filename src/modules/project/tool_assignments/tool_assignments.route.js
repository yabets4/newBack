import express from 'express';
import ToolAssignmentController from './tool_assignments.controller.js';
import permission from '../../../middleware/permission.middleware.js';

const router = express.Router();

const canRead = permission(['project.tool_assignments.read.all', 'project.read.all']);
const canCreate = permission(['project.tool_assignments.create', 'project.create']);
const canUpdate = permission(['project.tool_assignments.update', 'project.update']);
const canDelete = permission(['project.tool_assignments.delete', 'project.delete']);


router.get('/', canRead, ToolAssignmentController.getAll);
router.post('/', canCreate, ToolAssignmentController.create);
router.put('/:id', canUpdate, ToolAssignmentController.update);
router.delete('/:id', canDelete, ToolAssignmentController.delete);

export default router;
