
import RoleModel from './role.model.js';

const roleModel = new RoleModel();

// --- Roles ---
export const getAllRoles = async (limit = 50, offset = 0, companyId = null) => {
    return roleModel.findRoles({ limit, offset }, companyId);
};

export const getRoleById = async (roleId, companyId = null) => {
    return roleModel.findRoleById(roleId, companyId);
};

export const createRole = async (name, permissions = [], companyId = null) => {
    return roleModel.createRole({ name, permissions }, companyId);
};

export const updateRole = async (roleId, name, permissions = [], companyId = null) => {
    return roleModel.updateRole(roleId, { name, permissions }, companyId);
};

export const deleteRole = async (roleId, companyId = null) => {
    return roleModel.removeRole(roleId, companyId);
};

export const getPermissionsByRoles = async (roles, companyId = null) => {
    return roleModel.getPermissionsByRoles(roles, companyId);
};

// --- Permissions ---
export const getAllPermissions = async (limit = 50, offset = 0, companyId = null) => {
    return roleModel.findPermissions({ limit, offset }, companyId);
};

export const getPermissionById = async (permissionId, companyId = null) => {
    return roleModel.findPermissionById(permissionId, companyId);
};

export const createPermission = async (payload, companyId = null) => {
    return roleModel.createPermission(payload, companyId);
};

export const updatePermission = async (permissionId, payload, companyId = null) => {
    return roleModel.updatePermission(permissionId, payload, companyId);
};

export const removePermission = async (permissionId, companyId = null) => {
    return roleModel.removePermission(permissionId, companyId);
};

// --- RBAC (user → role assignments) ---
export const getRbacByUserId = async (userId, companyId = null) => {
    return roleModel.findRbacByUserId(userId, companyId);
};

export const addOrUpdateRbac = async (userId, roles = [], companyId = null) => {
    // Frontend sends role names directly (e.g. ["Admin", "User"])
    // rbacModel.upsertRbac expects an array of role names.
    return roleModel.upsertRbac(userId, roles, companyId);
};
