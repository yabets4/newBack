import pool from '../../../loaders/db.loader.js';

export const SelfModel = {
	// Get profile information for the authenticated user
	async getProfile(companyId, userId) {
		const { rows: profileRows } = await pool.query(
			`SELECT * FROM user_profiles WHERE company_id = $1 AND user_id = $2 LIMIT 1`,
			[companyId, userId]
		);

		if (!profileRows[0]) return null;
		const profile = profileRows[0];

		// Try to find an employee record by email (best-effort)
		let employee = null;
		let employmentDetails = null;
		let leaveBalances = [];
		let skillsCerts = [];
		let emergencyContacts = [];

		if (profile.email) {
			const { rows: empRows } = await pool.query(
				`SELECT * FROM employees WHERE company_id = $1 AND email = $2 LIMIT 1`,
				[companyId, profile.email]
			);

			if (empRows[0]) {
				employee = empRows[0];

				// Fetch comprehensive employment details (latest)
				const { rows: edRows } = await pool.query(
					`SELECT * FROM employee_employment_details
					 WHERE company_id = $1 AND employee_id = $2
					 ORDER BY created_at DESC LIMIT 1`,
					[companyId, employee.employee_id]
				);
				if (edRows[0]) employmentDetails = edRows[0];

				// Fetch leave balances
				const { rows: leaveRows } = await pool.query(
					`SELECT * FROM employee_leave_balances
					 WHERE company_id = $1 AND employee_id = $2
					 ORDER BY leave_type_key`,
					[companyId, employee.employee_id]
				);
				leaveBalances = leaveRows || [];

				// Fetch skills & certifications
				const { rows: skillsRows } = await pool.query(
					`SELECT * FROM employee_skills_certifications
					 WHERE company_id = $1 AND employee_id = $2`,
					[companyId, employee.employee_id]
				);
				skillsCerts = skillsRows || [];

				// Fetch emergency contacts
				const { rows: emergencyRows } = await pool.query(
					`SELECT * FROM employee_emergency_contacts
					 WHERE company_id = $1 AND employee_id = $2`,
					[companyId, employee.employee_id]
				);
				emergencyContacts = emergencyRows || [];
			}
		}

		return {
			profile,
			employee,
			employmentDetails,
			leaveBalances,
			skillsCerts,
			emergencyContacts
		};
	},

	// Allow updating basic user profile fields
	async updateProfile(companyId, userId, data) {
		const fields = [];
		const values = [companyId, userId];
		let idx = 3;
		if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
		if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email); }
		if (data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(data.phone); }
		if (data.role !== undefined) { fields.push(`role = $${idx++}`); values.push(data.role); }

		if (fields.length === 0) {
			const { rows } = await pool.query(
				`SELECT user_id, name, email, phone, role, created_at, updated_at
				 FROM user_profiles WHERE company_id = $1 AND user_id = $2 LIMIT 1`,
				[companyId, userId]
			);
			return rows[0] || null;
		}

		const q = `UPDATE user_profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE company_id = $1 AND user_id = $2 RETURNING user_id, name, email, phone, role, created_at, updated_at`;
		const { rows } = await pool.query(q, values);
		return rows[0] || null;
	}
};
