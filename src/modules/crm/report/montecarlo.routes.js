import { Router } from 'express';
import { runMontecarlo } from './montecarlo.controller.js';
import limiter from '../../../middleware/secondRateLimiter.middleware.js';

const router = Router();

// POST /crm/reports/montecarlo
router.post('/montecarlo', limiter, runMontecarlo);

export default router;
