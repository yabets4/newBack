import { Router } from 'express';
import LeaveRequestController from './leaveRequest.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();
// require auth for all leave request routes

const canRead = permission(['hr.leaves.read.all', 'hr.leaves.read.own_only']);
const canCreate = permission(['hr.leaves.create', 'hr.create']); // Request leave
const canUpdate = permission(['hr.leaves.update.all', 'hr.leaves.update.own_only']);
const canDelete = permission(['hr.leaves.delete.all', 'hr.delete']);
const canApprove = permission(['hr.leaves.update.all', 'hr.update']); // Approvers need update all permission

r.get('/', canRead, LeaveRequestController.getAll);
r.get('/:id', canRead, LeaveRequestController.getById);
r.get('/employee/:employeeId', canRead, LeaveRequestController.getByEmployee);
r.post('/', canCreate, LeaveRequestController.create);
r.put('/:id', canUpdate, LeaveRequestController.update);
r.delete('/:id', canDelete, LeaveRequestController.delete);

// approval endpoints
r.post('/:id/approve', canApprove, LeaveRequestController.approve);
r.post('/:id/reject', canApprove, LeaveRequestController.reject);

export default r;
