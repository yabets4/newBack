import PortalModel from './portal.model.js';
import jwt from 'jsonwebtoken';
import { appConfig } from '../../../../config/index.js';

const PortalService = {
	authenticateCustomer: async (companyId, customerId, password) => {
		const customer = await PortalModel.getCustomerByCompanyAndId(companyId, customerId);
		if (!customer) return null;

		// NOTE: In production, use bcrypt.compare for hashed passwords.
		if (String(customer.password_hash) !== String(password)) {
			return null;
		}

		return customer;
	},

	createTokenForCustomer: async (customer, gps = {}) => {
		const payload = {
			sub: `${customer.company_id}:${customer.customer_id}`,
			roles: ['customer'],
			company_id: customer.company_id,
			customer_id: customer.customer_id,
			gps,
		};

		const token = jwt.sign(payload, appConfig.jwtSecret, { expiresIn: '12h' });

		// Save a lightweight login session if table exists. Ignore failures.
		try {
			await PortalModel.saveLoginSession(customer.company_id, customer.customer_id, gps);
		} catch (err) {
			// model returns false on failure; still catch to avoid crash
			console.warn('Could not save customer login session:', err?.message || err);
		}

		return token;
	},

	changeCustomerPassword: async (companyId, customerId, oldPassword, newPassword) => {
		const customer = await PortalModel.getCustomerByCompanyAndId(companyId, customerId);
		if (!customer) return false;

		// NOTE: In production, use bcrypt.compare for hashed passwords.
		if (String(customer.password_hash) !== String(oldPassword)) {
			return false;
		}

		// Update password (in this codebase passwords are stored in password_hash column)
		const updated = await PortalModel.updateCustomerPassword(companyId, customerId, newPassword);
		return !!updated;
	},
};

export default PortalService;

