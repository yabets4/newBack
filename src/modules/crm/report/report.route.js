import { Router } from 'express';
import { getFullReport } from './report.controller.js';
import montecarlo from './montecarlo.routes.js';

const router = Router();

router.get('/', getFullReport);
// mount montecarlo forecasts under /reports/montecarlo
router.use('/', montecarlo);

export default router;
