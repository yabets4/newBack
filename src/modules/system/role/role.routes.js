
import { Router } from 'express';
import ctrl from './role.controller.js';
import permission from '../../../middleware/permission.middleware.js';

const r = Router();

// Granular permissions based on Frontend/src/pages/setting/userRoleSetting.jsx
const canReadRoles = permission('roles.read.all');
const canUpdateRoles = permission('roles.update.all'); // Covers Create/Update
const canDeleteRoles = permission('roles.delete.all');
// For assigning roles, we can treat it as updating users or roles. 
// Usually modifying a user's role falls under 'users.update.all' or 'roles.update.all'.
// Reviewing UI: "users.update.all" is for users.
const canAssignRoles = permission('users.update.all');

// Roles
r.get('/', canReadRoles, ctrl.getAllRoles);
r.get('/:roleId', canReadRoles, ctrl.getRoleById);
r.post('/', canUpdateRoles, ctrl.createRole);
r.put('/:roleId', canUpdateRoles, ctrl.updateRole);
r.delete('/:roleId', canDeleteRoles, ctrl.deleteRole);

// Permissions (Metadata, usually everyone with role access can read, restricted to update)
r.get('/permissions', canReadRoles, ctrl.getAllPermissions);
r.get('/permissions/:permissionId', canReadRoles, ctrl.getPermissionById);
r.post('/permissions', canUpdateRoles, ctrl.createPermission);
r.put('/permissions/:permissionId', canUpdateRoles, ctrl.updatePermission);
r.delete('/permissions/:permissionId', canDeleteRoles, ctrl.removePermission);

// Assign Roles to Users
// Using 'users.update.all' because this modifies a USER's state (their role)
r.get('/user/:userId', canAssignRoles, ctrl.getRbacByUserId);
r.put('/assign/:userId', canAssignRoles, ctrl.assignRolesToUser);

export default r;
