import { Router } from 'express';
import TaskController from './task.controller.js';
import permission from '../../../middleware/permission.middleware.js';

const router = Router({ mergeParams: true });

const canRead = permission(['project.tasks.read.all', 'project.tasks.read.own_only', 'project.read.all']);
const canCreate = permission(['project.tasks.create', 'project.create']);
const canUpdate = permission(['project.tasks.update', 'project.update']);
const canDelete = permission(['project.tasks.delete', 'project.delete']);

// Routes assumed to be mounted under a project path, e.g. /projects/:projectId/tasks
router.get('/', canRead, TaskController.list);
router.post('/', canCreate, TaskController.create);
router.get('/:taskId', canRead, TaskController.get);
router.put('/:taskId', canUpdate, TaskController.update);
router.delete('/:taskId', canDelete, TaskController.delete);

export default router;
