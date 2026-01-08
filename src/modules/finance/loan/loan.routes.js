import { Router } from 'express';
import {
  listLoans,
  createLoan,
  getLoanSchedule,
  listLiabilities,
  createLiability,
  markLiabilityPaid,
} from './loan.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['finance.loans.read.all', 'finance.read.all']);
const canCreate = permission(['finance.loans.create', 'finance.create']);
const canUpdate = permission(['finance.loans.update', 'finance.update']);

r.get('/', canRead, listLoans);
r.post('/', canCreate, createLoan);
r.get('/:id/schedule', canRead, getLoanSchedule);

// liabilities
r.get('/liabilities', canRead, listLiabilities);
r.post('/liabilities', canCreate, createLiability);
r.post('/liabilities/:id/mark-paid', canUpdate, markLiabilityPaid);

export default r;
