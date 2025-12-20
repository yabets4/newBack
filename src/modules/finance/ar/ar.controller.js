import ArService from './ar.service.js';
import { ok, created, notFound, internal } from '../../../utils/apiResponse.js';

export async function createInvoice(req, res) {
  try {
    const { companyID } = req.auth;
    let payload = { ...req.body };
    try { if (typeof payload.lines === 'string') payload.lines = JSON.parse(payload.lines); } catch (e) {}
    try { if (typeof payload.lineItems === 'string') payload.lineItems = JSON.parse(payload.lineItems); } catch (e) {}

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const files = req.files.map(f => ({ file_name: f.originalname, file_url: f.path.split('uploads')[1] ? `/uploads${f.path.split('uploads')[1].replace(/\\/g, '/')}` : f.path, storage_name: f.filename }));
      payload.attachments = Array.isArray(payload.attachments) ? payload.attachments.concat(files) : files;
    }

    if (!payload.customer_name && payload.customerName) payload.customer_name = String(payload.customerName);
    if (!payload.customer_id && payload.customerId) payload.customer_id = String(payload.customerId);

    const createdInv = await ArService.createInvoice(companyID, payload);
    return created(res, createdInv);
  } catch (err) {
    console.error('[ARController] createInvoice error:', err);
    return internal(res, err.message || 'Error creating invoice');
  }
}

export async function listInvoices(req, res) {
  try {
    const { companyID } = req.auth;
    const rows = await ArService.listInvoices(companyID);
    return ok(res, rows);
  } catch (err) {
    console.error('[ARController] listInvoices error:', err);
    return internal(res, err.message || 'Error fetching invoices');
  }
}

export async function getInvoice(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const inv = await ArService.getInvoice(companyID, id);
    if (!inv) return notFound(res, 'Invoice not found');
    return ok(res, inv);
  } catch (err) {
    console.error('[ARController] getInvoice error:', err);
    return internal(res, err.message || 'Error fetching invoice');
  }
}

export async function addPayment(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const payload = { ...req.body };
    const added = await ArService.addPayment(companyID, id, payload);
    return created(res, added);
  } catch (err) {
    console.error('[ARController] addPayment error:', err);
    return internal(res, err.message || 'Error adding payment');
  }
}

export default {
  createInvoice,
  listInvoices,
  getInvoice,
  addPayment,
};
