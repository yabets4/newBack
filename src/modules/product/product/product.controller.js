import { ProductService } from './product.service.js';
import { ok, badRequest, notFound, created } from '../../../utils/apiResponse.js';
import { getCompanyNameById } from '../../../middleware/services/company.service.js';

export async function getProducts(req, res) {
	try {
		const { companyID } = req.auth;
		const products = await ProductService.list(companyID);
		return ok(res, products);
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}

export async function getCustomizableProducts(req, res) {
	try {
		const { companyID } = req.auth;
		const products = await ProductService.list(companyID);
		const customizable = (products || []).filter(p => p.product_type === 'customizable' || p.product_type === 'configurable' || p.product_type === 'customisable');
		return ok(res, customizable);
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}
export async function getProduct(req, res) {
	try {
		const { companyID } = req.auth;
		const { id } = req.params;
		const product = await ProductService.get(companyID, id);
		if (!product) return notFound(res, 'Product not found');
		return ok(res, product);
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}

export async function createProduct(req, res) {
	try {
		const { companyID } = req.auth;
		let data = { ...req.body };

		// 1️⃣ Get company for upload path if file present
		const companyName = await getCompanyNameById(companyID) || 'default';
		const safeName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');
		// support multiple uploaded files (req.files) and single-file fallback (req.file)
		if (req.files && Array.isArray(req.files) && req.files.length > 0) {
			// store array of image urls and also set first image for compatibility
			const urls = req.files.map(f => `/uploads/${safeName}/products/${f.filename}`);
			data.image_urls = urls;
			data.image_url = urls[0];
		} else if (req.file) {
			data.image_url = `/uploads/${safeName}/products/${req.file.filename}`;
		}

		const createdP = await ProductService.create(companyID, data);
		return created(res, createdP);
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}

export async function updateProduct(req, res) {
	try {
		const { companyID } = req.auth;
		const { id } = req.params;
		let data = { ...req.body };

		const companyName = await getCompanyNameById(companyID) || 'default';
		const safeName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');
		if (req.files && Array.isArray(req.files) && req.files.length > 0) {
			const urls = req.files.map(f => `/uploads/${safeName}/products/${f.filename}`);
			data.image_urls = urls;
			data.image_url = urls[0];
		} else if (req.file) {
			data.image_url = `/uploads/${safeName}/products/${req.file.filename}`;
		}

		const updated = await ProductService.update(companyID, id, data);
		return ok(res, updated);
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}

export async function updateProductStatus(req, res) {
	try {
 		const { companyID } = req.auth;
 		const { id } = req.params;
 		const { status } = req.body;
 		if (typeof status === 'undefined' || status === null) return badRequest(res, 'Status is required');
 		const updated = await ProductService.updateStatus(companyID, id, status);
 		return ok(res, updated);
 	} catch (err) {
 		console.error(err);
 		return badRequest(res, err.message);
 	}
}

export async function deleteProduct(req, res) {
	try {
		const { companyID } = req.auth;
		const { id } = req.params;
		await ProductService.delete(companyID, id);
		return ok(res, { message: 'Deleted successfully' });
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}

