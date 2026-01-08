
import pool from '../../../loaders/db.loader.js';

export default class UserModel {
    // --- USERS ---
    async findUsers({ limit = 50, offset = 0 } = {}, companyId) {
        if (!companyId) throw new Error('companyId is required');
        const { rows } = await pool.query(
            `SELECT u.*, up.name, up.email, COALESCE(r.roles, '[]'::jsonb) as roles
             FROM users u
             LEFT JOIN user_profiles up ON u.user_id = up.user_id AND u.company_id = up.company_id
             LEFT JOIN rbac r ON u.user_id = r.user_id AND u.company_id = r.company_id
             WHERE u.company_id=$1
             ORDER BY u.created_at DESC
             LIMIT $2 OFFSET $3`,
            [companyId, limit, offset]
        );
        return rows;
    }

    async findUserById(id, companyId) {
        if (!companyId) throw new Error('companyId is required');
        const { rows } = await pool.query(
            `SELECT u.*, up.name, up.email, COALESCE(r.roles, '[]'::jsonb) as roles
             FROM users u
             LEFT JOIN user_profiles up ON u.user_id = up.user_id AND u.company_id = up.company_id
             LEFT JOIN rbac r ON u.user_id = r.user_id AND u.company_id = r.company_id
             WHERE u.id=$1 AND u.company_id=$2`,
            [id, companyId]
        );
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
