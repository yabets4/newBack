import PortalService from './portal.service.js';
import { ok, badRequest, unauthorized } from '../../../../utils/apiResponse.js';

const PortalController = {
	login: async (req, res) => {
		const { company_id, customer_id, password, gps } = req.body || {};
		if (!company_id || !customer_id || !password || !gps) {
			return badRequest(res, 'company_id, customer_id, password and gps required');
		}

		try {
			const customer = await PortalService.authenticateCustomer(company_id, customer_id, password);
			if (!customer) return unauthorized(res, 'Invalid credentials');

			const token = await PortalService.createTokenForCustomer(customer, gps);

			return ok(res, {
				token,
				customer: {
					company_id: customer.company_id,
					customer_id: customer.customer_id,
					name: customer.name || null,
				},
			});
		} catch (err) {
			console.error('Portal login error:', err);
			return badRequest(res, 'Login failed');
		}
	},

	changePassword: async (req, res) => {
		// Allow authenticated customers (via portal JWT) to omit company/customer in body
		let { company_id, customer_id, old_password, new_password } = req.body || {};

		if (req.customer) {
			company_id = req.customer.company_id;
			customer_id = req.customer.customer_id;
		}

		if (!company_id || !customer_id || !old_password || !new_password) {
			return badRequest(res, 'company_id, customer_id, old_password and new_password required');
		}

		try {
			const changed = await PortalService.changeCustomerPassword(company_id, customer_id, old_password, new_password);
			if (!changed) return unauthorized(res, 'Invalid credentials or password not changed');

			return ok(res, { message: 'Password changed successfully' });
		} catch (err) {
			console.error('Portal changePassword error:', err);
			return badRequest(res, 'Change password failed');
		}
	},
};

export default PortalController;

