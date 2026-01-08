import { Router } from 'express';
import { getSettings, upsertSettings, calculateTax, listFilings, createFiling } from './tax.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['finance.tax.read.all', 'finance.read.all']);
const canUpdate = permission(['finance.tax.update', 'finance.update']); // Settings
const canCreate = permission(['finance.tax.create', 'finance.create']); // Filings

r.get('/settings', canRead, getSettings);
r.put('/settings', canUpdate, upsertSettings);
r.post('/calculate', canRead, calculateTax); // Calculation is often just a read/compute operation

r.get('/filings', canRead, listFilings);
r.post('/filings', canCreate, createFiling);

export default r;
