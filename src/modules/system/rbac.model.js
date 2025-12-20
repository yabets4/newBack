// src/modules/system/rbac.model.js
import pool from '../../loaders/db.loader.js';

export default class RbacModel {
  constructor() {}

  // --- RBAC ---
  async findRbacByUserId(userId, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const { rows } = await pool.query(
      `SELECT * FROM rbac WHERE user_id=$1 AND company_id=$2`,
      [userId, companyId]
    );
    return rows[0] || null;
  }

  async upsertRbac(userId, roles = [], companyId) {
    if (!companyId) throw new Error('companyId is required');
    const roleNames = roles.map(r => String(r));
    const existing = await this.findRbacByUserId(userId, companyId);

    if (existing) {
      const { rows } = await pool.query(
        `UPDATE rbac
         SET roles=$1 WHERE id=$2 RETURNING *`,
        [JSON.stringify(roleNames), existing.id]
      );
      return rows[0];
    } else {
      const { rows } = await pool.query(
        `INSERT INTO rbac (user_id, roles, company_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [userId, JSON.stringify(roleNames), companyId]
      );
      return rows[0];
    }
  }

  // --- ROLES table helpers ---
  async findRoles({ limit = 50, offset = 0 } = {}, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const { rows } = await pool.query(
      `SELECT * FROM roles WHERE company_id=$1 ORDER BY id DESC LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );
    return rows;
  }

  async findRoleById(roleId, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const { rows } = await pool.query(
      `SELECT * FROM roles WHERE id=$1 AND company_id=$2`,
      [roleId, companyId]
    );
    return rows[0] || null;
  }

  async createRole({ name, permissions = [] }, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const { rows } = await pool.query(
      `INSERT INTO roles (company_id, name, permissions) VALUES ($1, $2, $3) RETURNING *`,
      [companyId, name, JSON.stringify(permissions)]
    );
    return rows[0];
  }

  async updateRole(roleId, { name, permissions = [] }, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const { rows } = await pool.query(
      `UPDATE roles SET name=$1, permissions=$2 WHERE id=$3 AND company_id=$4 RETURNING *`,
      [name, JSON.stringify(permissions), roleId, companyId]
    );
    return rows[0] || null;
  }

  async removeRole(roleId, companyId) {
    if (!companyId) throw new Error('companyId is required');
    await pool.query(`DELETE FROM roles WHERE id=$1 AND company_id=$2`, [roleId, companyId]);
    return true;
  }

  // --- PERMISSIONS ---
  async findPermissions({ limit = 50, offset = 0 } = {}, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const { rows } = await pool.query(
      `SELECT * FROM permissions WHERE company_id=$1 ORDER BY id DESC LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );
    return rows;
  }

  async findPermissionById(permissionId, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const { rows } = await pool.query(
      `SELECT * FROM permissions WHERE id=$1 AND company_id=$2`,
      [permissionId, companyId]
    );
    return rows[0] || null;
  }

  async createPermission({ name, description = '' }, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const { rows } = await pool.query(
      `INSERT INTO permissions (company_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [companyId, name, description]
    );
    return rows[0];
  }

  async updatePermission(permissionId, { name, description = '' }, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const { rows } = await pool.query(
      `UPDATE permissions SET name=$1, description=$2 WHERE id=$3 AND company_id=$4 RETURNING *`,
      [name, description, permissionId, companyId]
    );
    return rows[0] || null;
  }

  async removePermission(permissionId, companyId) {
    if (!companyId) throw new Error('companyId is required');
    await pool.query(`DELETE FROM permissions WHERE id=$1 AND company_id=$2`, [permissionId, companyId]);
    return true;
  }

  // --- USERS ---
  async findUsers({ limit = 50, offset = 0 } = {}, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE company_id=$1 ORDER BY id DESC LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );
    return rows;
  }

  async findUserById(id, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const { rows } = await pool.query(`SELECT * FROM users WHERE id=$1 AND company_id=$2`, [id, companyId]);
    return rows[0] || null;
  }

  async createUser(payload, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const p = { ...(payload || {}) };
    if (!p.company_id) p.company_id = companyId;
    const keys = Object.keys(p);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(`INSERT INTO users (${cols}) VALUES (${params}) RETURNING *`, Object.values(p));
    return rows[0];
  }

  async updateUser(id, payload, companyId) {
    if (!companyId) throw new Error('companyId is required');
    const p = { ...(payload || {}) };
    if (!p.company_id) p.company_id = companyId;
    const keys = Object.keys(p);
    const set = keys.map((k, i) => `"${k}"=$${i + 1}`).join(', ');
    const params = [...Object.values(p), id, companyId];
    const sql = `UPDATE users SET ${set} WHERE id=$${keys.length + 1} AND company_id=$${keys.length + 2} RETURNING *`;
    const { rows } = await pool.query(sql, params);
    return rows[0] || null;
  }

  async removeUser(id, companyId) {
    if (!companyId) throw new Error('companyId is required');
    await pool.query(`DELETE FROM users WHERE id=$1 AND company_id=$2`, [id, companyId]);
    return true;
  }
}
