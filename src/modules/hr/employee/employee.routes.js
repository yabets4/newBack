import { Router } from 'express';
import EmployeeController from './employee.controller.js';
import {uploadEmployeePhoto} from '../../../middleware/multer.middleware.js';
import permission from '../../../middleware/permission.middleware.js';

const r = Router();
// r.use(auth(true)); // Removed local auth

const canRead = permission(['hr.employees.read.all', 'hr.employees.read.own_only']);
const canCreate = permission(['hr.employees.create', 'hr.create']);
const canUpdate = permission(['hr.employees.update.all', 'hr.employees.update.own_only']);
const canDelete = permission(['hr.employees.delete.all', 'hr.delete']);

r.get('/', canRead, EmployeeController.getAll);
r.get('/info', canRead, EmployeeController.getInfo);
r.get('/:id', canRead, EmployeeController.getById);
r.get('/:id/leave-balances', canRead, EmployeeController.getLeaveBalances);
r.patch('/:id/status', canUpdate, EmployeeController.setStatus);
r.post('/', canCreate, uploadEmployeePhoto.any(), EmployeeController.create);
r.put('/:id', canUpdate, uploadEmployeePhoto.any(), EmployeeController.update);
r.delete('/:id', canDelete, EmployeeController.delete);
// Admin: set leave balances for an employee
r.post('/:id/leave-balances', canUpdate, EmployeeController.setLeaveBalances);
// Promotion
r.post('/:id/promote', canUpdate, EmployeeController.promote);

export default r;
