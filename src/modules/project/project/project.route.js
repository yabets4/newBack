import { Router } from 'express';
import ProjectController from './project.controller.js';
import { uploadProjectFiles } from '../../../middleware/multer.middleware.js';
import TaskRoute from '../task/task.route.js';

const router = Router();

// Accept multiple project files under the `uploadedFiles` field
router.post('/', uploadProjectFiles.array('uploadedFiles', 20), ProjectController.create);
router.get('/', ProjectController.getAll);
router.get('/get-info', ProjectController.getInfo);
router.get('/:id', ProjectController.getById);
// Allow replacing/adding files on update via multipart/form-data
router.put('/:id', uploadProjectFiles.array('uploadedFiles', 20), ProjectController.update);
router.delete('/:id', ProjectController.delete);

// Mount task routes under each project: /projects/:projectId/tasks
router.use('/:projectId/tasks', TaskRoute);

export default router;
