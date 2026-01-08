import { Router } from 'express';
import ProjectController from './project.controller.js';
import { uploadProjectFiles } from '../../../middleware/multer.middleware.js';
import TaskRoute from '../task/task.route.js';
import permission from '../../../middleware/permission.middleware.js';

const router = Router();

const canRead = permission(['project.projects.read.all', 'project.projects.read.own_only', 'project.read.all']);
const canCreate = permission(['project.projects.create', 'project.create']);
const canUpdate = permission(['project.projects.update', 'project.update']);
const canDelete = permission(['project.projects.delete', 'project.delete']);

// Accept multiple project files under the `uploadedFiles` field
router.post('/', canCreate, uploadProjectFiles.array('uploadedFiles', 20), ProjectController.create);
router.get('/', canRead, ProjectController.getAll);
router.get('/get-info', canRead, ProjectController.getInfo);
router.get('/:id', canRead, ProjectController.getById);
// Allow replacing/adding files on update via multipart/form-data
router.put('/:id', canUpdate, uploadProjectFiles.array('uploadedFiles', 20), ProjectController.update);
router.delete('/:id', canDelete, ProjectController.delete);

// Mount task routes under each project: /projects/:projectId/tasks
router.use('/:projectId/tasks', TaskRoute);

export default router;
