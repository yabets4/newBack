import * as srv from './rbac.service.js';
import { ok, badRequest, unauthorized } from '../../utils/apiResponse.js';

export default {
  // --- USERS ---
  getAllUsers: async (req, res, next) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const companyId = req.auth?.companyID || null;
      const users = await srv.getAllUsers(limit, offset, companyId);
      return ok(res, users);
    } catch (e) { next(e); }
  },

  getUserById: async (req, res, next) => {
    try {
      const companyId = req.auth?.companyID || null;
      const user = await srv.getUserById(req.params.userId, companyId);
      return ok(res, user);
    } catch (e) { next(e); }
  },

  createUser: async (req, res, next) => {
    try {
      // If authenticated, prefer company from token when not provided in body
      const payload = { ...(req.body || {}) };
      const companyId = req.auth?.companyID || null;
      const created = await srv.createUser(payload, companyId);
      return ok(res, created);
    } catch (e) { next(e); }
  },

  updateUser: async (req, res, next) => {
    try {
      const payload = { ...(req.body || {}) };
      const companyId = req.auth?.companyID || null;
      const updated = await srv.updateUser(req.params.userId, payload, companyId);
      return ok(res, updated);
    } catch (e) { next(e); }
  },

  removeUser: async (req, res, next) => {
    try {
      const companyId = req.auth?.companyID || null;
      await srv.removeUser(req.params.userId, companyId);
      return ok(res, null); // or return ok(res, { message: "User removed" })
    } catch (e) { next(e); }
  },


  // --- ROLES ---
  getAllRoles: async (req, res, next) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const companyId = req.auth?.companyID || null;
      const roles = await srv.getAllRoles(limit, offset, companyId);
      return ok(res, roles);
    } catch (e) { next(e); }
  },

  getRoleById: async (req, res, next) => {
    try {
      const companyId = req.auth?.companyID || null;
      const role = await srv.getRoleById(req.params.roleId, companyId);
      return ok(res, role);
    } catch (e) { next(e); }
  },

  createRole: async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    const companyId = req.auth?.companyID || null;
    const created = await srv.createRole(name, permissions, companyId);
    return ok(res, created);
  } catch (e) {
    next(e);
  }
},


updateRole: async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    const companyId = req.auth?.companyID || null;
    const updated = await srv.updateRole(req.params.roleId, name, permissions, companyId);
    return ok(res, updated);
  } catch (e) {
    next(e);
  }
},

    deleteRole: async (req, res, next) => {
    try {
      const roleId = req.params.roleId;
      const companyId = req.auth?.companyID || null;
      await srv.deleteRole(roleId, companyId);
      return ok(res, null); // role removed
    } catch (e) {
      next(e);
    }
  },

  // --- PERMISSIONS ---
  getAllPermissions: async (req, res, next) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const companyId = req.auth?.companyID || null;
      const permissions = await srv.getAllPermissions(limit, offset, companyId);
      return ok(res, permissions);
    } catch (e) { next(e); }
  },

  getPermissionById: async (req, res, next) => {
    try {
      const companyId = req.auth?.companyID || null;
      const perm = await srv.getPermissionById(req.params.permissionId, companyId);
      return ok(res, perm);
    } catch (e) { next(e); }
  },

  createPermission: async (req, res, next) => {
    try {
      const companyId = req.auth?.companyID || null;
      const created = await srv.createPermission(req.body, companyId);
      return ok(res, created);
    } catch (e) { next(e); }
  },

  updatePermission: async (req, res, next) => {
    try {
      const companyId = req.auth?.companyID || null;
      const updated = await srv.updatePermission(req.params.permissionId, req.body, companyId);
      return ok(res, updated);
    } catch (e) { next(e); }
  },

  removePermission: async (req, res, next) => {
    try {
      const companyId = req.auth?.companyID || null;
      await srv.removePermission(req.params.permissionId, companyId);
      return ok(res, null); // or ok(res, { message: "Permission removed" })
    } catch (e) { next(e); }
  },
  assignRolesToUser: async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const { roles } = req.body; // array of role IDs

      if (!userId) return badRequest(res, 'User ID is required');
      if (!Array.isArray(roles)) return badRequest(res, 'Roles must be an array');

      // Service converts IDs → names and updates RBAC
      const companyId = req.auth?.companyID || null;
      const updatedRbac = await srv.addOrUpdateRbac(userId, roles, companyId);

      return ok(res, updatedRbac);
    } catch (e) {
      next(e);
    }
  },

  getRbacByUserId: async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return badRequest(res, 'User ID is required');

      const companyId = req.auth?.companyID || null;
      const record = await srv.getRbacByUserId(userId, companyId);
      return ok(res, record || null);
    } catch (e) {
      next(e);
    }
  },


};