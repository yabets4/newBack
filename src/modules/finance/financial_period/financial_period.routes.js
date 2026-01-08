import { Router } from 'express';
import FinancialPeriodController from './financial_period.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['finance.periods.read.all', 'finance.read.all']);
const canCreate = permission(['finance.periods.create', 'finance.create']);
const canUpdate = permission(['finance.periods.update', 'finance.update']);

// List all
r.get('/', canRead, FinancialPeriodController.getPeriods);

// Create next period
r.post('/', canCreate, FinancialPeriodController.createPeriod);

// Open/Close
r.post('/:id/open', canUpdate, FinancialPeriodController.openPeriod);
r.post('/:id/close', canUpdate, FinancialPeriodController.closePeriod);

// Settings
r.get('/settings', canRead, FinancialPeriodController.getFiscalSettings);
r.post('/settings', canUpdate, FinancialPeriodController.saveFiscalSettings);

export default r;
