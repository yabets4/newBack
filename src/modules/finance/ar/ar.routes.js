import { Router } from 'express';
import { createInvoice, listInvoices, getInvoice, addPayment } from './ar.controller.js';
import { CheckTierLimit } from '../../../middleware/checkTierLimit.middleware.js';
import { uploadArInvoiceAttachments } from '../../../middleware/multer.middleware.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['finance.ar.read.all', 'finance.read.all']);
const canCreate = permission(['finance.ar.create', 'finance.create']);
const canUpdate = permission(['finance.ar.update', 'finance.update']);

r.get('/', canRead, listInvoices);
r.get('/:id', canRead, getInvoice);
r.post('/', canCreate, uploadArInvoiceAttachments.array('attachments', 10), CheckTierLimit('ar_invoices'), createInvoice);
r.post('/:id/payments', canUpdate, addPayment);

export default r;
