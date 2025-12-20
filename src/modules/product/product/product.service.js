import { ProductModel } from './product.model.js';

export const ProductService = {
	async list(companyId) {
		return await ProductModel.findAll(companyId);
	},

	async get(companyId, productId) {
		return await ProductModel.findById(companyId, productId);
	},

	async create(companyId, data) {
		const required = ['name', 'sku'];
		const missing = required.filter(f => !data[f]);
		if (missing.length) throw new Error(`Missing required fields: ${missing.join(', ')}`);
		// price and stock are optional but ensure numeric where provided
		if (data.price && isNaN(Number(data.price))) throw new Error('Invalid price');
		if (data.stock && isNaN(Number(data.stock))) throw new Error('Invalid stock');
		return await ProductModel.insert(companyId, data);
	},

	async update(companyId, productId, data) {
		return await ProductModel.update(companyId, productId, data);
	},

	async updateStatus(companyId, productId, status) {
		if (!status) throw new Error('Status is required');
		return await ProductModel.updateStatus(companyId, productId, status);
	},

	async delete(companyId, productId) {
		const deleted = await ProductModel.delete(companyId, productId);
		if (!deleted) throw new Error('Product not found');
		return true;
	}
};

