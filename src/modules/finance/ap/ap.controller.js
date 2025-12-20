import ApService from './ap.service.js';
import { ok, created, notFound, internal } from '../../../utils/apiResponse.js';

// Handler to accept multipart file uploads and return metadata to client.


export async function createInvoice(req, res) {
  try {
    const { companyID } = req.auth;
    // Support both JSON body and multipart/form-data (with files uploaded by multer)
    let payload = { ...req.body };

    // If body fields like `lines` were sent as JSON strings (from multipart form), parse them
    try {
      if (typeof payload.lines === 'string') payload.lines = JSON.parse(payload.lines);
    } catch (e) { /* ignore parse errors */ }
    try {
      if (typeof payload.lineItems === 'string') payload.lineItems = JSON.parse(payload.lineItems);
    } catch (e) { /* ignore parse errors */ }

    // If files were uploaded using multer, map them into payload.attachments
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const files = req.files.map(f => ({ file_name: f.originalname, file_url: f.path.split('uploads')[1] ? `/uploads${f.path.split('uploads')[1].replace(/\\/g, '/')}` : f.path, storage_name: f.filename }));
      payload.attachments = Array.isArray(payload.attachments) ? payload.attachments.concat(files) : files;
    }

    // Normalize vendor fields. Accept both camelCase and snake_case keys.
    if (!payload.vendor_name && payload.vendorName) payload.vendor_name = String(payload.vendorName);
    if (!payload.vendor_name && payload.vendor_name === undefined && payload.vendorName === undefined && payload.vendor_id && typeof payload.vendor_id === 'string') {
      // keep vendor_id as-is (don't overwrite). If callers provided only an id, we store id in vendor_id
    }
    // Ensure vendor_id is present if provided via vendorId
    if (!payload.vendor_id && payload.vendorId) payload.vendor_id = String(payload.vendorId);

    const createdInv = await ApService.createInvoice(companyID, payload);
    return created(res, createdInv);
  } catch (err) {
    console.error('[APController] createInvoice error:', err);
    return internal(res, err.message || 'Error creating invoice');
  }
}

export async function listInvoices(req, res) {
  try {
    const { companyID } = req.auth;
    const rows = await ApService.listInvoices(companyID);
    return ok(res, rows);
  } catch (err) {
    console.error('[APController] listInvoices error:', err);
    return internal(res, err.message || 'Error fetching invoices');
  }
}

export async function getInvoice(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const inv = await ApService.getInvoice(companyID, id);
    if (!inv) return notFound(res, 'Invoice not found');
    return ok(res, inv);
  } catch (err) {
    console.error('[APController] getInvoice error:', err);
    return internal(res, err.message || 'Error fetching invoice');
  }
}

export async function matchInvoice(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const result = await ApService.matchInvoice(companyID, id);
    return ok(res, result);
  } catch (err) {
    console.error('[APController] matchInvoice error:', err);
    return internal(res, err.message || 'Error matching invoice');
  }
}

export default {
  createInvoice,
  listInvoices,
  getInvoice,
  matchInvoice,
};
