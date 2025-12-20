import SelfService from './self.service.js';
import { ok, notFound, badRequest } from '../../../utils/apiResponse.js';

const service = new SelfService();

const SelfController = {
	// GET /api/tenant/hr/self
	async getProfile(req, res, next) {
		try {
			const companyId = req.auth?.companyID;
			const userId = req.auth?.user;
			if (!companyId || !userId) return badRequest(res, 'Missing auth information');

			const profile = await service.getProfile(companyId, userId);
            console.log(profile);
			if (!profile) return notFound(res, 'Profile not found');
			return ok(res, profile);
		} catch (e) {
			next(e);
		}
	},

	// PUT /api/tenant/hr/self
	async updateProfile(req, res, next) {
		try {
			const companyId = req.auth?.companyID;
			const userId = req.auth?.user;
			if (!companyId || !userId) return badRequest(res, 'Missing auth information');

			const data = { ...req.body };
			const updated = await service.updateProfile(companyId, userId, data);
			if (!updated) return notFound(res, 'Profile not found or nothing to update');
			return ok(res, updated);
		} catch (e) {
			next(e);
		}
	}
};

export default SelfController;
