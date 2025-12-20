import { Router } from 'express';
import SelfController from './self.controller.js';

const r = Router();

// Controller assumes `req.auth` is populated by hr.routes middleware (authenticateJWT)
r.get('/', SelfController.getProfile);
r.put('/', SelfController.updateProfile);

export default r;
