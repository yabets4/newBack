import { SelfModel } from './self.model.js';

export default class SelfService {
	constructor() {}

	async getProfile(companyId, userId) {
		// Return the raw model output so callers can decide how to shape it
		const raw = await SelfModel.getProfile(companyId, userId);
		return raw;
	}

	async updateProfile(companyId, userId, data) {
		// Basic validation can be added by controller; here we pass-through to model
		const updated = await SelfModel.updateProfile(companyId, userId, data);
		return updated;
	}
}
