import { Router } from 'express';
import { getSummary, getHistory, postRun } from './payroll.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['finance.payroll.read.all', 'finance.read.all']);
// Posting payroll run -> effectively an update/create action
const canPost = permission(['finance.payroll.create', 'finance.payroll.update', 'finance.create', 'finance.update']);

r.get('/integration/summary', canRead, getSummary);
r.get('/integration/history', canRead, getHistory);
r.post('/integration/post', canPost, postRun);

export default r;
