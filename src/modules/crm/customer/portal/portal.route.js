import { Router } from 'express';
import PortalController from './portal.controller.js';
import { authenticatePortalJWT } from './jwt.middleware.js';

const router = Router();
router.use(authenticatePortalJWT);

// Customer portal login
router.post('/login', PortalController.login);
// Customer change password (requires portal JWT)
router.post('/change-password', PortalController.changePassword);

export default router;

