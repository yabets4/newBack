import pool from '../../../loaders/db.loader.js';

export const SelfModel = {
	// Get profile information for the authenticated user
	async getProfile(companyId, userId) {
		const { rows } = await pool.query(
			`SELECT user_id, name, email, phone, role, created_at, updated_at
			 FROM user_profiles WHERE company_id = $1 AND user_id = $2 LIMIT 1`,
			[companyId, userId]
		);
		if (!rows[0]) return null;
		const profile = rows[0];

		// Try to find an employee record by email (best-effort)
		let employee = null;
		if (profile.email) {
			const { rows: empRows } = await pool.query(
				`SELECT employee_id, name AS employee_name, email AS employee_email, phone_number, profile_photo_url, date_of_birth
				 FROM employees WHERE company_id = $1 AND email = $2 LIMIT 1`,
				[companyId, profile.email]
			);
			if (empRows[0]) {
				employee = empRows[0];
				// fetch latest employment details (department, job_title, work_location, hire_date)
				const { rows: empDetailRows } = await pool.query(
					`SELECT work_location, department, job_title, hire_date
					 FROM employee_employment_details
					 WHERE company_id = $1 AND employee_id = $2
					 ORDER BY created_at DESC LIMIT 1`,
					[companyId, employee.employee_id]
				);
				if (empDetailRows[0]) {
					employee = { ...employee, ...empDetailRows[0] };
				}
			}
		}


		// Fetch employment details (latest)
		let employmentDetails = null;
		if (employee && employee.employee_id) {
			const { rows: edRows } = await pool.query(
				`SELECT id, work_location, department, job_title, hire_date, employee_type, base_salary, pay_frequency, bank_name, bank_account_number, created_at
				 FROM employee_employment_details
				 WHERE company_id = $1 AND employee_id = $2
				 ORDER BY created_at DESC LIMIT 1`,
				[companyId, employee.employee_id]
			);
			if (edRows[0]) employmentDetails = edRows[0];

			// Fetch leave balances
			const { rows: leaveRows } = await pool.query(
				`SELECT leave_type, leave_type_key, total_days, remaining_days
				 FROM employee_leave_balances
				 WHERE company_id = $1 AND employee_id = $2
				 ORDER BY leave_type_key`,
				[companyId, employee.employee_id]
			);

			// Fetch skills & certifications
			const { rows: skillsRows } = await pool.query(
				`SELECT skill_name, certification_name, issued_by, expiry_date, attachment
				 FROM employee_skills_certifications
				 WHERE company_id = $1 AND employee_id = $2`,
				[companyId, employee.employee_id]
			);

			// Fetch emergency contacts
			const { rows: emergencyRows } = await pool.query(
				`SELECT contact_name, relationship, phone, national_id_number, national_id_attachment
				 FROM employee_emergency_contacts
				 WHERE company_id = $1 AND employee_id = $2`,
				[companyId, employee.employee_id]
			);

			// Build composite pieces
			const leaveBalances = leaveRows || [];
			const skillsCerts = skillsRows || [];
			const emergencyContacts = emergencyRows || [];

			return { profile, employee, employmentDetails, leaveBalances, skillsCerts, emergencyContacts };
		}

		// If no employee found, still return profile only
		return { profile, employee: null, employmentDetails: null, leaveBalances: [], skillsCerts: [], emergencyContacts: [] };
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
