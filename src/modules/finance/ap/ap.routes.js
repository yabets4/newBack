import { Router } from 'express';
import { createInvoice, listInvoices, getInvoice, matchInvoice } from './ap.controller.js';
import { CheckTierLimit } from '../../../middleware/checkTierLimit.middleware.js';
import { uploadInvoiceAttachments } from '../../../middleware/multer.middleware.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['finance.ap.read.all', 'finance.read.all']);
const canCreate = permission(['finance.ap.create', 'finance.create']);
const canUpdate = permission(['finance.ap.update', 'finance.update']);

r.get('/', canRead, listInvoices);
r.get('/:id', canRead, getInvoice);
r.post('/', canCreate, uploadInvoiceAttachments.array('attachments', 10), CheckTierLimit('ap_invoices'), createInvoice);
r.post('/:id/match', canUpdate, matchInvoice);

// Upload attachments (multipart/form-data) under field name `attachments`

export default r;
