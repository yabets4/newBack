import { Router } from 'express';
import ReportsController from './reports.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const router = Router();

const canRead = permission(['hr.reports.read.all', 'hr.read.all']);

router.get('/', canRead, ReportsController.dashboard);
router.get('/:reportId', canRead, ReportsController.getReport);

export default router;
