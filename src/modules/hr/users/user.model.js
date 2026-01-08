    
import pool from '../../../loaders/db.loader.js';

export const UserModel = {
	async create(companyId, data = {}) {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			// ensure user_id
			let user_id = data.user_id;
			if (!user_id) {
				const { rows } = await client.query(
					`UPDATE companies SET next_user_number = COALESCE(next_user_number, 0) + 1 WHERE company_id = $1 RETURNING next_user_number`,
					[companyId]
				);
				const num = rows[0].next_user_number;
				user_id = `USR-${String(num).padStart(6, '0')}`;
			}

			await client.query(
				`INSERT INTO users (company_id, user_id, is_system_admin) VALUES ($1,$2,$3)`,
				[companyId, user_id, data.is_system_admin || false]
			);

			// upsert profile: ensure password and role defaults, then try update, insert if none
			const profileParams = [companyId, user_id];
			const profileFields = [];
			const profileValues = [];
			if (data.name !== undefined) { profileFields.push('name'); profileValues.push(data.name); }
			if (data.email !== undefined) { profileFields.push('email'); profileValues.push(data.email); }
			if (data.phone !== undefined) { profileFields.push('phone'); profileValues.push(data.phone); }
			if (data.password !== undefined) { profileFields.push('password'); profileValues.push(data.password); }
			if (data.role !== undefined) { profileFields.push('role'); profileValues.push(data.role); }

			// defaults: password = '0000', role = 'staff' when not provided
			if (!profileFields.includes('password')) { profileFields.push('password'); profileValues.push('0000'); }
			if (!profileFields.includes('role')) { profileFields.push('role'); profileValues.push('staff'); }

			if (profileFields.length > 0) {
				// build update
				const setParts = profileFields.map((f, i) => `${f} = $${i + 3}`);
				const updateQ = `UPDATE user_profiles SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE company_id = $1 AND user_id = $2`;
				const { rowCount } = await client.query(updateQ, profileParams.concat(profileValues));
				if (rowCount === 0) {
					// insert
					const cols = ['company_id','user_id', ...profileFields];
					const placeholders = cols.map((_, i) => `$${i + 1}`);
					const insertQ = `INSERT INTO user_profiles (${cols.join(',')}, created_at, updated_at) VALUES (${placeholders.join(',')}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
					await client.query(insertQ, [companyId, user_id, ...profileValues]);
				}
			} else {
				// no profile fields provided: create a minimal profile row to satisfy schema if desired
				// skip automatic empty profile creation
			}

			await client.query('COMMIT');
			return { company_id: companyId, user_id, ...data };
		} catch (err) {
			await client.query('ROLLBACK');
			console.error('UserModel.create error', err);
			throw err;
		} finally {
			client.release();
		}
	},

	async update(companyId, userId, data = {}) {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			// update users table (currently only is_system_admin supported)
			const userFields = [];
			const userParams = [companyId, userId];
			let idx = 3;
			if ('is_system_admin' in data) {
				userFields.push(`is_system_admin = $${idx++}`);
				userParams.push(data.is_system_admin);
			}
			if (userFields.length > 0) {
				const q = `UPDATE users SET ${userFields.join(', ')} WHERE company_id = $1 AND user_id = $2`;
				await client.query(q, userParams);
			}

			// update profile
			const allowed = ['name','email','phone','password','role'];
			const profileSet = [];
			const profileParams = [companyId, userId];
			idx = 3;
			for (const k of allowed) {
				if (k in data) {
					profileSet.push(`${k} = $${idx++}`);
					profileParams.push(data[k]);
				}
			}

			let profileRow = null;
			if (profileSet.length > 0) {
				profileSet.push('updated_at = CURRENT_TIMESTAMP');
				const uq = `UPDATE user_profiles SET ${profileSet.join(', ')} WHERE company_id = $1 AND user_id = $2 RETURNING *`;
				const { rows } = await client.query(uq, profileParams);
				profileRow = rows[0] || null;
				if (!profileRow) {
					// insert if not exists
					const cols = ['company_id','user_id'];
					const vals = [companyId, userId];
					for (const k of allowed) {
						if (k in data) {
							cols.push(k);
							vals.push(data[k]);
						}
					}
					const placeholders = cols.map((_, i) => `$${i + 1}`);
					const iq = `INSERT INTO user_profiles (${cols.join(',')}, created_at, updated_at) VALUES (${placeholders.join(',')}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`;
					const res = await client.query(iq, vals);
					profileRow = res.rows[0];
				}
			} else {
				// fetch existing profile if needed
				const { rows } = await client.query(`SELECT * FROM user_profiles WHERE company_id = $1 AND user_id = $2`, [companyId, userId]);
				profileRow = rows[0] || null;
			}

			await client.query('COMMIT');
			return { company_id: companyId, user_id: userId, profile: profileRow };
		} catch (err) {
			await client.query('ROLLBACK');
			console.error('UserModel.update error', err);
			throw err;
		} finally {
			client.release();
		}
	},

	async remove(companyId, userId) {
		const { rowCount } = await pool.query(
			`DELETE FROM users WHERE company_id = $1 AND user_id = $2`,
			[companyId, userId]
		);
		return rowCount > 0;
	},

	async activate(companyId, userId) {
		const { rows } = await pool.query(
			`UPDATE users SET is_active = TRUE WHERE company_id = $1 AND user_id = $2 RETURNING *`,
			[companyId, userId]
		);
		return rows[0] || null;
	},

	async deactivate(companyId, userId) {
		const { rows } = await pool.query(
			`UPDATE users SET is_active = FALSE WHERE company_id = $1 AND user_id = $2 RETURNING *`,
			[companyId, userId]
		);
		return rows[0] || null;
	},

	async findById(companyId, userId) {
		const { rows } = await pool.query(
			`SELECT u.*, p.name, p.email, p.phone, p.role, p.created_at AS profile_created_at, p.updated_at AS profile_updated_at
			 FROM users u
			 LEFT JOIN user_profiles p ON p.company_id = u.company_id AND p.user_id = u.user_id
			 WHERE u.company_id = $1 AND u.user_id = $2`,
			[companyId, userId]
		);
		return rows[0] || null;
	},

	async findAll(companyId, opts = {}) {
		const { role, search, limit = 100, offset = 0 } = opts;
		const clauses = ['u.company_id = $1'];
		const params = [companyId];
		let idx = 2;
		if (role) {
			clauses.push(`p.role = $${idx++}`);
			params.push(role);
		}
		if (search) {
			clauses.push(`(p.name ILIKE $${idx} OR p.email ILIKE $${idx})`);
			params.push(`%${search}%`);
			idx++;
		}
		const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
		const q = `SELECT u.*, p.name, p.email, p.phone, p.role FROM users u LEFT JOIN user_profiles p ON p.company_id = u.company_id AND p.user_id = u.user_id ${where} ORDER BY p.name NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`;
		params.push(limit, offset);
		const { rows } = await pool.query(q, params);
		return rows;
	}
};

export default UserModel;

