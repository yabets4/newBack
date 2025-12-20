import { Router } from 'express';
import AdminUserController from './adminUser.controller.js';

const r = Router();


// ---------------- Users ----------------
r.get('/admin/', AdminUserController.listUsers);
r.post('/admin/', AdminUserController.createUser);
r.put('/admin/:id', AdminUserController.updateUser);
r.delete('/admin/:id', AdminUserController.deleteUser);

// ---------------- Roles ----------------
r.get('/admin/roles', AdminUserController.listRoles);
r.post('/admin/roles', AdminUserController.createRole);
r.put('/admin/roles/:id', AdminUserController.updateRole);
r.delete('/admin/roles/:id', AdminUserController.deleteRole);

// ---------------- RBAC ----------------
r.get('/admin/:id/roles', AdminUserController.getUserRoles);
r.post('/admin/:id/roles', AdminUserController.assignRoles);
r.delete('/admin/:id/roles', AdminUserController.removeRole);

// ---------------- Single User ----------------
r.get('/admin/:id', AdminUserController.getUser);


export default r;
