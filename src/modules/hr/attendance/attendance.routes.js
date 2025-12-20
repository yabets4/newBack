import { Router } from 'express';
import AttendanceController from './attendance.controller.js';
import { uploadAttendanceCsv } from '../../../middleware/multer.middleware.js';

const r = Router();
// require auth for all attendance routes

r.get('/', AttendanceController.list);
r.get('/:id', AttendanceController.get);
r.post('/', AttendanceController.create);
r.post('/import', uploadAttendanceCsv.single('file'), AttendanceController.importCsv);
r.get('/employee/:id', AttendanceController.getByEmployeeRange);
r.put('/:id', AttendanceController.update);
r.delete('/:id', AttendanceController.delete);

export default r;
