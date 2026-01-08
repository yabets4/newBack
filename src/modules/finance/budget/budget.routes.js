import { Router } from 'express';
import { CheckTierLimit } from '../../../middleware/checkTierLimit.middleware.js';
import {
  listBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  generateForecast,
} from './budget.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['finance.budget.read.all', 'finance.read.all']);
const canCreate = permission(['finance.budget.create', 'finance.create']);
const canUpdate = permission(['finance.budget.update', 'finance.update']);
const canDelete = permission(['finance.budget.delete', 'finance.delete']);

r.get('/', canRead, listBudgets);
r.get('/:id', canRead, getBudget);
r.post('/', canCreate, CheckTierLimit('budgets'), createBudget);
r.put('/:id', canUpdate, updateBudget);
r.delete('/:id', canDelete, deleteBudget);

// Forecast/projection endpoint
r.post('/forecast', canCreate, generateForecast);

export default r;
