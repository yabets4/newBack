import { Router } from 'express';
import { listCurrencies, createCurrency, getCurrency, updateCurrency, deleteCurrency, addExchangeRate, deleteExchangeRate } from './currency.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['finance.currency.read.all', 'finance.read.all']);
const canCreate = permission(['finance.currency.create', 'finance.create']);
const canUpdate = permission(['finance.currency.update', 'finance.update']);
const canDelete = permission(['finance.currency.delete', 'finance.delete']);

r.get('/', canRead, listCurrencies);
r.post('/', canCreate, createCurrency);
r.get('/:id', canRead, getCurrency);
r.put('/:id', canUpdate, updateCurrency);
r.delete('/:id', canDelete, deleteCurrency);

// Exchange rates
r.get('/:id/rates', canRead, getCurrency); // reuse get to include rates
r.post('/:id/rates', canUpdate, addExchangeRate);
r.delete('/:id/rates/:rateId', canUpdate, deleteExchangeRate);

export default r;
