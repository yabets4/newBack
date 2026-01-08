
import pool from '../../../loaders/db.loader.js';

export default class RoleModel {
    // --- ROLES ---
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

    // --- RBAC ---
    async findRbacByUserId(userId, companyId) {
        if (!companyId) throw new Error('companyId is required');
        const { rows } = await pool.query(
            `SELECT * FROM rbac WHERE user_id=$1 AND company_id=$2`,
            [userId, companyId]
        );
        return rows[0] || null;
    }

    async getPermissionsByRoles(roles, companyId = null) {
        if (!roles || roles.length === 0) return [];
        const params = [roles];

        let query = `
            SELECT permissions
            FROM roles
            WHERE name = ANY($1)
        `;

        let paramIndex = 2;

        if (companyId) {
            query += ` AND (company_id = $${paramIndex} OR company_id IS NULL)`;
            params.push(companyId);
        }

        const res = await pool.query(query, params);

        const allPermissions = new Set();
        res.rows.forEach(row => {
            let perms = [];
            if (row.permissions) {
                if (Array.isArray(row.permissions)) {
                    perms = row.permissions;
                } else if (typeof row.permissions === 'string') {
                    try {
                        perms = JSON.parse(row.permissions);
                    } catch (e) {
                        console.error('Failed to parse permissions for role', e);
                    }
                }
            }
            perms.forEach(p => allPermissions.add(String(p)));
        });

        return Array.from(allPermissions);
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
}
