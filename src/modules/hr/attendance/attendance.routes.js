import { Router } from 'express';
import AttendanceController from './attendance.controller.js';
import { uploadAttendanceCsv } from '../../../middleware/multer.middleware.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();
// require auth for all attendance routes

const canRead = permission(['hr.attendance.read.all', 'hr.attendance.read.own_only']);
const canCreate = permission(['hr.attendance.create', 'hr.create']);
const canUpdate = permission(['hr.attendance.update.all', 'hr.attendance.update.own_only']);
const canDelete = permission(['hr.attendance.delete.all', 'hr.delete']); // Usually specific to admin

r.get('/', canRead, AttendanceController.list);
r.get('/:id', canRead, AttendanceController.get);
r.post('/', canCreate, AttendanceController.create);
r.post('/import', canCreate, uploadAttendanceCsv.single('file'), AttendanceController.importCsv);
r.get('/employee/:id', canRead, AttendanceController.getByEmployeeRange);
r.put('/:id', canUpdate, AttendanceController.update);
r.delete('/:id', canDelete, AttendanceController.delete);

export default r;
