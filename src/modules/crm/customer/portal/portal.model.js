import pool from '../../../../loaders/db.loader.js';

const PortalModel = {
	getCustomerByCompanyAndId: async (companyId, customerId) => {
		const sql = `
			SELECT c.company_id, c.customer_id, c.password_hash, cp.name
			FROM customers c
			LEFT JOIN customer_profiles cp
				ON cp.company_id = c.company_id AND cp.customer_id = c.customer_id
			WHERE c.company_id = $1 AND c.customer_id = $2
			LIMIT 1
		`;
		const { rows } = await pool.query(sql, [companyId, customerId]);
		return rows[0] || null;
	},

	saveLoginSession: async (companyId, customerId, gps = {}) => {
		try {
			await pool.query(
				`INSERT INTO customer_login_sessions (company_id, customer_id, gps_lat, gps_lon)
				 VALUES ($1, $2, $3, $4)`,
				[companyId, customerId, gps.lat || null, gps.lon || null]
			);
			return true;
		} catch (err) {
			// don't throw - logging can be done by caller
			return false;
		}
	},

	updateCustomerPassword: async (companyId, customerId, newPassword) => {
		try {
			await pool.query(
				`UPDATE customers SET password_hash = $3 WHERE company_id = $1 AND customer_id = $2`,
				[companyId, customerId, newPassword]
			);
			return true;
		} catch (err) {
			return false;
		}
	},
};

export default PortalModel;
