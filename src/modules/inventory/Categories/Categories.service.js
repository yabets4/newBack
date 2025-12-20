import CategoriesModel from './Categories.model.js';

const CategoriesService = {
	// Categories
	createCategory: async (data) => {
		if (!data.company_id) throw new Error('company_id is required');
		if (!data.name) throw new Error('name is required');
		return await CategoriesModel.createCategory(data);
	},

	getAllCategories: async (company_id) => {
		return await CategoriesModel.fetchAllCategories(company_id);
	},

	getCategoryById: async (company_id, category_id) => {
		return await CategoriesModel.fetchCategoryById(company_id, category_id);
	},

	updateCategory: async (company_id, category_id, data) => {
		if (!data.name) throw new Error('name is required');
		return await CategoriesModel.updateCategory(company_id, category_id, data);
	},

	deleteCategory: async (company_id, category_id) => {
		return await CategoriesModel.deleteCategory(company_id, category_id);
	},

	// Units of measure
	createUOM: async (data) => {
		if (!data.company_id) throw new Error('company_id is required');
		if (!data.name) throw new Error('name is required');
		return await CategoriesModel.createUOM(data);
	},

	getAllUOMs: async (company_id) => {
		return await CategoriesModel.fetchAllUOMs(company_id);
	},

	getUOMById: async (company_id, uom_id) => {
		return await CategoriesModel.fetchUOMById(company_id, uom_id);
	},

	updateUOM: async (company_id, uom_id, data) => {
		if (!data.name) throw new Error('name is required');
		return await CategoriesModel.updateUOM(company_id, uom_id, data);
	},

	deleteUOM: async (company_id, uom_id) => {
		return await CategoriesModel.deleteUOM(company_id, uom_id);
	}
};

export default CategoriesService;

