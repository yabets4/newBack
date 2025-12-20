import { Router } from 'express';
import LeaveRequestController from './leaveRequest.controller.js';

const r = Router();
// require auth for all leave request routes

r.get('/', LeaveRequestController.getAll);
r.get('/:id', LeaveRequestController.getById);
r.get('/employee/:employeeId', LeaveRequestController.getByEmployee);
r.post('/', LeaveRequestController.create);
r.put('/:id', LeaveRequestController.update);
r.delete('/:id', LeaveRequestController.delete);

// approval endpoints
r.post('/:id/approve', LeaveRequestController.approve);
r.post('/:id/reject', LeaveRequestController.reject);

export default r;
