import CategoriesService from './Categories.service.js';

const CategoriesController = {
	// ---- Units of Measure (place these first so '/uoms' doesn't collide with '/:id') ----
	listUOMs: async (req, res) => {
		try {
			const { companyID } = req.auth;
			const uoms = await CategoriesService.getAllUOMs(companyID);
			res.status(200).json(uoms);
		} catch (err) {
			console.error('listUOMs error', err);
			res.status(500).json({ message: 'Internal server error' });
		}
	},

	createUOM: async (req, res) => {
		try {
			const { companyID } = req.auth;
			const payload = { ...req.body, company_id: companyID };
			const uom = await CategoriesService.createUOM(payload);
			res.status(201).json(uom);
		} catch (err) {
			console.error('createUOM error', err);
			res.status(400).json({ message: err.message || 'Bad request' });
		}
	},

	getUOM: async (req, res) => {
		try {
			const { companyID } = req.auth;
			const { id } = req.params;
			const uom = await CategoriesService.getUOMById(companyID, id);
			if (!uom) return res.status(404).json({ message: 'UOM not found' });
			res.status(200).json(uom);
		} catch (err) {
			console.error('getUOM error', err);
			res.status(500).json({ message: 'Internal server error' });
		}
	},

	updateUOM: async (req, res) => {
		try {
			const { companyID } = req.auth;
			const { id } = req.params;
			const updated = await CategoriesService.updateUOM(companyID, id, req.body);
			if (!updated) return res.status(404).json({ message: 'UOM not found' });
			res.status(200).json(updated);
		} catch (err) {
			console.error('updateUOM error', err);
			res.status(400).json({ message: err.message || 'Bad request' });
		}
	},

	deleteUOM: async (req, res) => {
		try {
			const { companyID } = req.auth;
			const { id } = req.params;
			const deleted = await CategoriesService.deleteUOM(companyID, id);
			if (!deleted) return res.status(404).json({ message: 'UOM not found' });
			res.status(200).json({ message: 'UOM deleted' });
		} catch (err) {
			console.error('deleteUOM error', err);
			res.status(500).json({ message: 'Internal server error' });
		}
	},

	// ---- Categories ----
	listCategories: async (req, res) => {
		try {
			const { companyID } = req.auth;
			const cats = await CategoriesService.getAllCategories(companyID);
			res.status(200).json(cats);
		} catch (err) {
			console.error('listCategories error', err);
			res.status(500).json({ message: 'Internal server error' });
		}
	},

	createCategory: async (req, res) => {
		try {
			const { companyID } = req.auth;
			const payload = { ...req.body, company_id: companyID };
			const cat = await CategoriesService.createCategory(payload);
			res.status(201).json(cat);
		} catch (err) {
			console.error('createCategory error', err);
			res.status(400).json({ message: err.message || 'Bad request' });
		}
	},

	getCategory: async (req, res) => {
		try {
			const { companyID } = req.auth;
			const { id } = req.params;
			const cat = await CategoriesService.getCategoryById(companyID, id);
			if (!cat) return res.status(404).json({ message: 'Category not found' });
			res.status(200).json(cat);
		} catch (err) {
			console.error('getCategory error', err);
			res.status(500).json({ message: 'Internal server error' });
		}
	},

	updateCategory: async (req, res) => {
		try {
			const { companyID } = req.auth;
			const { id } = req.params;
			const updated = await CategoriesService.updateCategory(companyID, id, req.body);
			if (!updated) return res.status(404).json({ message: 'Category not found' });
			res.status(200).json(updated);
		} catch (err) {
			console.error('updateCategory error', err);
			res.status(400).json({ message: err.message || 'Bad request' });
		}
	},

	deleteCategory: async (req, res) => {
		try {
			const { companyID } = req.auth;
			const { id } = req.params;
			const deleted = await CategoriesService.deleteCategory(companyID, id);
			if (!deleted) return res.status(404).json({ message: 'Category not found' });
			res.status(200).json({ message: 'Category deleted' });
		} catch (err) {
			console.error('deleteCategory error', err);
			res.status(500).json({ message: 'Internal server error' });
		}
	}
};

export default CategoriesController;

