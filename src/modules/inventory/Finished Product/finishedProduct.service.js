
import { FinishedProductModel } from './finishedProduct.model.js';

export const FinishedProductService = {
	async list(companyId) {
		return await FinishedProductModel.findAll(companyId);
	},

	async get(companyId, finishedProductId) {
		return await FinishedProductModel.findById(companyId, finishedProductId);
	},

	async create(companyId, data) {
		const required = ['name', 'sku'];
		const missing = required.filter(f => !data[f]);
		if (missing.length) throw new Error(`Missing required fields: ${missing.join(', ')}`);
		if (data.quantity && isNaN(Number(data.quantity))) throw new Error('Invalid quantity');
		if (data.cost_price && isNaN(Number(data.cost_price))) throw new Error('Invalid cost_price');
		if (data.selling_price && isNaN(Number(data.selling_price))) throw new Error('Invalid selling_price');
		// materials_used may be array/object/string JSON — no strict validation here
		return await FinishedProductModel.insert(companyId, data);
	},

	async update(companyId, finishedProductId, data) {
		return await FinishedProductModel.update(companyId, finishedProductId, data);
	},

	async updateStatus(companyId, finishedProductId, status) {
		if (typeof status === 'undefined' || status === null) throw new Error('Status is required');
		return await FinishedProductModel.updateStatus(companyId, finishedProductId, status);
	},

	async delete(companyId, finishedProductId) {
		const deleted = await FinishedProductModel.delete(companyId, finishedProductId);
		if (!deleted) throw new Error('Finished product not found');
		return true;
	}
};
