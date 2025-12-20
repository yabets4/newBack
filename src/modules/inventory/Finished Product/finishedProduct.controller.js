
import { FinishedProductService } from './finishedProduct.service.js';
import { ok, badRequest, notFound, created } from '../../../utils/apiResponse.js';
import { getCompanyNameById } from '../../../middleware/services/company.service.js';

export async function getFinishedProducts(req, res) {
	try {
		const { companyID } = req.auth;
		const items = await FinishedProductService.list(companyID);
		return ok(res, items);
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}

export async function getFinishedProduct(req, res) {
	try {
		const { companyID } = req.auth;
		const { id } = req.params;
		const item = await FinishedProductService.get(companyID, id);
		if (!item) return notFound(res, 'Finished product not found');
		return ok(res, item);
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}

export async function createFinishedProduct(req, res) {
	try {
		const { companyID } = req.auth;
		let data = { ...req.body };

		const companyName = await getCompanyNameById(companyID) || 'default';
		const safeName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');
		if (req.files && Array.isArray(req.files) && req.files.length > 0) {
			const urls = req.files.map(f => `/uploads/${safeName}/finished/${f.filename}`);
			data.image_urls = urls;
			data.image_url = urls[0];
		} else if (req.file) {
			data.image_url = `/uploads/${safeName}/finished/${req.file.filename}`;
		}

		const createdItem = await FinishedProductService.create(companyID, data);
		return created(res, createdItem);
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}

export async function updateFinishedProduct(req, res) {
	try {
		const { companyID } = req.auth;
		const { id } = req.params;
		let data = { ...req.body };

		const companyName = await getCompanyNameById(companyID) || 'default';
		const safeName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');
		if (req.files && Array.isArray(req.files) && req.files.length > 0) {
			const urls = req.files.map(f => `/uploads/${safeName}/finished/${f.filename}`);
			data.image_urls = urls;
			data.image_url = urls[0];
		} else if (req.file) {
			data.image_url = `/uploads/${safeName}/finished/${req.file.filename}`;
		}

		const updated = await FinishedProductService.update(companyID, id, data);
		return ok(res, updated);
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}

export async function updateFinishedProductStatus(req, res) {
	try {
		const { companyID } = req.auth;
		const { id } = req.params;
		const { status } = req.body;
		if (typeof status === 'undefined' || status === null) return badRequest(res, 'Status is required');
		const updated = await FinishedProductService.updateStatus(companyID, id, status);
		return ok(res, updated);
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}

export async function deleteFinishedProduct(req, res) {
	try {
		const { companyID } = req.auth;
		const { id } = req.params;
		await FinishedProductService.delete(companyID, id);
		return ok(res, { message: 'Deleted successfully' });
	} catch (err) {
		console.error(err);
		return badRequest(res, err.message);
	}
}
