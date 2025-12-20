// src/modules/system/rbac.service.js
import RbacModel from './rbac.model.js';

const rbacModel = new RbacModel();

// --- Roles ---
export const getAllRoles = async (limit = 50, offset = 0, companyId = null) => {
  return rbacModel.findRoles({ limit, offset }, companyId);
};

export const getRoleById = async (roleId, companyId = null) => {
  return rbacModel.findRoleById(roleId, companyId);
};

export const createRole = async (name, permissions = [], companyId = null) => {
  return rbacModel.createRole({ name, permissions }, companyId);
};

export const updateRole = async (roleId, name, permissions = [], companyId = null) => {
  return rbacModel.updateRole(roleId, { name, permissions }, companyId);
};

export const deleteRole = async (roleId, companyId = null) => {
  return rbacModel.removeRole(roleId, companyId);
};

// --- RBAC (user → role assignments) ---
export const getRbacByUserId = async (userId, companyId = null) => {
  return rbacModel.findRbacByUserId(userId, companyId);
};

export const addOrUpdateRbac = async (userId, roleIds = [], companyId = null) => {
  // Convert role IDs → role names using the internal RbacModel
  const roleNames = [];
  for (const id of roleIds) {
    const role = await rbacModel.findRoleById(id, companyId);
    if (role) roleNames.push(role.name);
  }

  // Upsert RBAC record with role names
  return rbacModel.upsertRbac(userId, roleNames, companyId);
}


// --- Users ---
export const getAllUsers = async (limit = 50, offset = 0, companyId = null) => {
  return rbacModel.findUsers({ limit, offset }, companyId);
};

export const getUserById = async (userId, companyId = null) => {
  return rbacModel.findUserById(userId, companyId);
};

export const createUser = async (payload, companyId = null) => {
  return rbacModel.createUser(payload, companyId);
};

export const updateUser = async (userId, payload, companyId = null) => {
  return rbacModel.updateUser(userId, payload, companyId);
};

export const deleteUser = async (userId, companyId = null) => {
  return rbacModel.removeUser(userId, companyId);
};

// --- PERMISSIONS ---
export const getAllPermissions = async (limit = 50, offset = 0, companyId = null) => {
  return rbacModel.findPermissions({ limit, offset }, companyId);
};

export const getPermissionById = async (permissionId, companyId = null) => {
  return rbacModel.findPermissionById(permissionId, companyId);
};

export const createPermission = async (payload, companyId = null) => {
  return rbacModel.createPermission(payload, companyId);
};

export const updatePermission = async (permissionId, payload, companyId = null) => {
  return rbacModel.updatePermission(permissionId, payload, companyId);
};

export const removePermission = async (permissionId, companyId = null) => {
  return rbacModel.removePermission(permissionId, companyId);
};
