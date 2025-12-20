import pool from '../../../loaders/db.loader.js';

export default class AdminUserModel {
  constructor() {}

  // ---------------- Users ----------------
  async findUsers(opts = {}) {
    const { limit = 50, offset = 0, search = '' } = opts;
    const res = await pool.query(
      `SELECT * FROM admin_users
       WHERE name ILIKE $1 OR email ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${search}%`, limit, offset]
    );
    return res.rows;
  }

  async findUserById(userId) {
    const res = await pool.query(`SELECT * FROM admin_users WHERE user_id = $1`, [userId]);
    return res.rows[0];
  }

async createUser(data) {
  const { name, email, phone, password, role } = data;

  // Step 1: Insert into admin_users
  const userRes = await pool.query(
    `INSERT INTO admin_users (name, email, phone, password)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, email, phone, password]
  );
  const user = userRes.rows[0];
  console.log(user);
  

  // Step 2: Insert roles into admin_rbac
  const rbacRes = await pool.query(
    `INSERT INTO admin_rbac (user_id, roles)
     VALUES ($1, $2) RETURNING *`,
    [user.user_id, JSON.stringify([role])]
  );

  // Merge user + roles into response
  return {
    ...user,
    roles: rbacRes.rows[0].roles,
  };
}

  async updateUser(userId, data) {
    const { name, email, phone, role } = data;
    const res = await pool.query(
      `UPDATE admin_users SET name=$1, email=$2, phone=$3, role=$4, updated_at=NOW()
       WHERE user_id=$5 RETURNING *`,
      [name, email, phone, role, userId]
    );
    return res.rows[0];
  }

  async deleteUser(userId) {
    const res = await pool.query(`DELETE FROM admin_users WHERE user_id=$1 RETURNING *`, [userId]);
    return res.rows[0];
  }

  // ---------------- Roles ----------------
  async listRoles() {
    const res = await pool.query(`SELECT * FROM admin_roles ORDER BY id ASC`);
    return res.rows;
  }

  async createRole(name, permissions = []) {
    const res = await pool.query(
      `INSERT INTO admin_roles (name, permissions) VALUES ($1, $2) RETURNING *`,
      [name, JSON.stringify(permissions)]
    );
    return res.rows[0];
  }

  async updateRole(id, data) {
    const { name, permissions } = data;
    const res = await pool.query(
      `UPDATE admin_roles SET name=$1, permissions=$2 WHERE id=$3 RETURNING *`,
      [name, JSON.stringify(permissions), id]
    );
    return res.rows[0];
  }

  async deleteRole(id) {
    const res = await pool.query(`DELETE FROM admin_roles WHERE id=$1 RETURNING *`, [id]);
    return res.rows[0];
  }

  // ---------------- RBAC ----------------
  async getUserRoles(userId) {
    const res = await pool.query(`SELECT roles FROM admin_rbac WHERE user_id=$1`, [userId]);
    return res.rows[0]?.roles || [];
  }

  async assignRoles(userId, roles = []) {
    const exists = await pool.query(`SELECT id FROM admin_rbac WHERE user_id=$1`, [userId]);
    if (exists.rows.length > 0) {
      const res = await pool.query(
        `UPDATE admin_rbac SET roles=$1 WHERE user_id=$2 RETURNING *`,
        [JSON.stringify(roles), userId]
      );
      return res.rows[0];
    } else {
      const res = await pool.query(
        `INSERT INTO admin_rbac (user_id, roles) VALUES ($1, $2) RETURNING *`,
        [userId, JSON.stringify(roles)]
      );
      return res.rows[0];
    }
  }

  async removeRole(userId, roleName) {
    const currentRoles = await this.getUserRoles(userId);
    const updatedRoles = currentRoles.filter((r) => r !== roleName);
    const res = await pool.query(`UPDATE admin_rbac SET roles=$1 WHERE user_id=$2 RETURNING *`, [
      JSON.stringify(updatedRoles),
      userId,
    ]);
    return res.rows[0];
  }
}
