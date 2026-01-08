import { Router } from 'express';
import {
  getCompensation,
  upsertCompensation,
  processPayroll,
  listPayrollRuns,
  getPayrollRun,
  listPayslips,
  getPayslip,
} from './payroll.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['hr.payroll.read.all', 'hr.payroll.read.own_only']);
const canManage = permission(['hr.payroll.create', 'hr.payroll.update', 'hr.create', 'hr.update']);

r.get('/compensation/:employeeId', canRead, getCompensation);
r.put('/compensation/:employeeId', canManage, upsertCompensation);

r.post('/process', canManage, processPayroll);

r.get('/runs', canRead, listPayrollRuns);
r.get('/runs/:id', canRead, getPayrollRun);

r.get('/payslips', canRead, listPayslips);
r.get('/payslips/:id', canRead, getPayslip);

export default r;
