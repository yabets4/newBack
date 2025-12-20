import { Router } from 'express';
import TaskController from './task.controller.js';

const router = Router({ mergeParams: true });

// Routes assumed to be mounted under a project path, e.g. /projects/:projectId/tasks
router.get('/', TaskController.list);
router.post('/', TaskController.create);
router.get('/:taskId', TaskController.get);
router.put('/:taskId', TaskController.update);
router.delete('/:taskId', TaskController.delete);

export default router;
