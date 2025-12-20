import { Router } from 'express';
import EmployeeController from './employee.controller.js';
import auth from '../../../middleware/auth.middleware.js';
import { uploadEmployeePhoto } from '../../../middleware/multer.middleware.js';

const r = Router();
r.use(auth(true));



r.get('/',  EmployeeController.getAll);
r.get('/:id',  EmployeeController.getById);
r.get('/:id/leave-balances', EmployeeController.getLeaveBalances);
r.patch('/:id/status', EmployeeController.setStatus);
r.post('/',  uploadEmployeePhoto.any(), EmployeeController.create);
r.put('/:id', uploadEmployeePhoto.any(), EmployeeController.update);
r.delete('/:id', EmployeeController.delete);
// Admin: set leave balances for an employee
r.post('/:id/leave-balances', EmployeeController.setLeaveBalances);

export default r;
