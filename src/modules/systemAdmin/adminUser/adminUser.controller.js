import service from './adminUser.service.js';
import { ok, created, notFound } from '../../../utils/apiResponse.js';

export default class AdminUserController {
  // ---------------- Users ----------------
  static async listUsers(req, res, next) {
    try {
      const data = await service.listUsers(req.query);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async getUser(req, res, next) {
    try {
      const item = await service.getUser(req.params.id);
      if (!item) return notFound(res);
      return ok(res, item);
    } catch (e) {
      next(e);
    }
  }

  static async createUser(req, res, next) {
    try {
      const data = await service.createUser(req.body);
      return created(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const data = await service.updateUser(req.params.id, req.body);
      if (!data) return notFound(res);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const data = await service.deleteUser(req.params.id);
      if (!data) return notFound(res);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  // ---------------- Roles ----------------
  static async listRoles(req, res, next) {
    try {
      const data = await service.listRoles();
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async createRole(req, res, next) {
    try {
      const { name, permissions } = req.body;
      const data = await service.createRole(name, permissions);
      return created(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async updateRole(req, res, next) {
    try {
      const data = await service.updateRole(req.params.id, req.body);
      if (!data) return notFound(res);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async deleteRole(req, res, next) {
    try {
      const data = await service.deleteRole(req.params.id);
      if (!data) return notFound(res);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  // ---------------- RBAC ----------------
  static async getUserRoles(req, res, next) {
    try {
      const data = await service.getUserRoles(req.params.id);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async assignRoles(req, res, next) {
    try {
      const { roles } = req.body;
      const data = await service.assignRoles(req.params.id, roles);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async removeRole(req, res, next) {
    try {
      const { roleName } = req.body;
      const data = await service.removeRole(req.params.id, roleName);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }
}
