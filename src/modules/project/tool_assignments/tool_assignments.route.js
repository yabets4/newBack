import express from 'express';
import ToolAssignmentController from './tool_assignments.controller.js';

const router = express.Router();


router.get('/', ToolAssignmentController.getAll);
router.post('/', ToolAssignmentController.create);
router.put('/:id', ToolAssignmentController.update);
router.delete('/:id', ToolAssignmentController.delete);

export default router;
