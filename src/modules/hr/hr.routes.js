import { Router } from 'express';
import EmployeeController from './employee/employee.routes.js';
import selfRoutes from './self/self.route.js';
import leaveRequestRoutes from './Leave Request/leaveRequest.routes.js';
import assignedToolRoutes from './assigned Tool/assignedTool.route.js';
import Attendance from "./attendance/attendance.routes.js"
import ShiftController from './shift/shift.controller.js';
import auth from '../../middleware/auth.middleware.js';
import { authenticateJWT } from '../../middleware/jwt.middleware.js';
import permission from '../../middleware/permission.middleware.js';
import auditRoutes from './AuditLog/auditLog.route.js';
import onboardingRoutes from './onboarding/onboarding.routes.js';
import offboardingRoutes from './offboarding/offboarding.routes.js';
import performanceRoutes from './performance/performance.routes.js';
import departmentRoutes from './departments/department.routes.js';
import PayrollRoutes from './payroll/payroll.routes.js';
import reportsRoutes from './reports/reports.route.js';

const r = Router();
// r.use(auth(true), authenticateJWT); // Removed global auth

// Permissions for Shifts
const canReadShifts = permission(['hr.shifts.read.all', 'hr.read.all']);
const canCreateShifts = permission(['hr.shifts.create', 'hr.create']);
const canUpdateShifts = permission(['hr.shifts.update', 'hr.update']);
const canDeleteShifts = permission(['hr.shifts.delete', 'hr.delete']);


r.use('/employee', EmployeeController);
r.use('/attendance', Attendance)
// current user profile (self)
r.use('/self', selfRoutes);

// Audit logs
r.use('/audit', auditRoutes);

// Onboarding / Offboarding
r.use('/onboarding', onboardingRoutes);
r.use('/offboarding', offboardingRoutes);

// Performance management
r.use('/performance', performanceRoutes);

// --- attendance ---


// --- shift ---
r.get('/shift', canReadShifts, ShiftController.list);
r.get('/shift/:id', canReadShifts, ShiftController.get);
r.get('/shift/employee/:employeeId', canReadShifts, ShiftController.getByEmployee);
r.post('/shift', canCreateShifts, ShiftController.create);
r.put('/shift/:id', canUpdateShifts, ShiftController.update);
r.delete('/shift/:id', canDeleteShifts, ShiftController.delete);

// --- leave-request ---
r.use('/leave-request', leaveRequestRoutes);

// Departments and jobs
r.use('/departments', departmentRoutes);

// Payroll (HR -> finance integration)
r.use('/payroll', PayrollRoutes);

// Reports
r.use('/reports', reportsRoutes);

// --- assigned-tools ---
r.use('/assigned-tools', assignedToolRoutes);


export default r;
