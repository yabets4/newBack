import { Router } from 'express';
import { createInvoice, listInvoices, getInvoice, matchInvoice } from './ap.controller.js';
import { CheckTierLimit } from '../../../middleware/checkTierLimit.middleware.js';
import { uploadInvoiceAttachments } from '../../../middleware/multer.middleware.js';

const r = Router();

r.get('/', listInvoices);
r.get('/:id', getInvoice);
r.post('/', uploadInvoiceAttachments.array('attachments', 10), CheckTierLimit('ap_invoices'), createInvoice);
r.post('/:id/match', matchInvoice);

// Upload attachments (multipart/form-data) under field name `attachments`

export default r;
