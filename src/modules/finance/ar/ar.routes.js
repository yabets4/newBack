import { Router } from 'express';
import { createInvoice, listInvoices, getInvoice, addPayment } from './ar.controller.js';
import { CheckTierLimit } from '../../../middleware/checkTierLimit.middleware.js';
import { uploadArInvoiceAttachments } from '../../../middleware/multer.middleware.js';

const r = Router();

r.get('/', listInvoices);
r.get('/:id', getInvoice);
r.post('/', uploadArInvoiceAttachments.array('attachments', 10), CheckTierLimit('ar_invoices'), createInvoice);
r.post('/:id/payments', addPayment);

export default r;
