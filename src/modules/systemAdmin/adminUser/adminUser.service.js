import AdminUserModel from './adminUser.model.js';

const model = new AdminUserModel();

export default {
  // Users
  listUsers: (opts) => model.findUsers(opts),
  getUser: (id) => model.findUserById(id),
  createUser: (data) => model.createUser(data),
  updateUser: (id, data) => model.updateUser(id, data),
  deleteUser: (id) => model.deleteUser(id),

  // Roles
  listRoles: () => model.listRoles(),
  createRole: (name, permissions) => model.createRole(name, permissions),
  updateRole: (id, data) => model.updateRole(id, data),
  deleteRole: (id) => model.deleteRole(id),

  // RBAC
  getUserRoles: (userId) => model.getUserRoles(userId),
  assignRoles: (userId, roles) => model.assignRoles(userId, roles),
  removeRole: (userId, roleName) => model.removeRole(userId, roleName),
};
