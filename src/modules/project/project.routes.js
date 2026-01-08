import { Router } from 'express';
import auth from '../../middleware/auth.middleware.js';
import { authenticateJWT } from '../../middleware/jwt.middleware.js';
import ProjectRoute from './project/project.route.js';
import ToolAssignmentRoute from './tool_assignments/tool_assignments.route.js';

const router = Router();
// router.use(auth(true), authenticateJWT); // Removed global auth

router.use('/projects', ProjectRoute);
router.use('/tool-assignments', ToolAssignmentRoute);

export default router;
