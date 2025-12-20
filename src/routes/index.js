import { Router } from 'express';
import publicRoutes from './public.routes.js';
import tenantRoutes from './tenant.routes.js';

const router = Router();
router.use('/public', publicRoutes);
router.use('/tenant', tenantRoutes);

export default router;
