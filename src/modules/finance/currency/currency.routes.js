import { Router } from 'express';
import { listCurrencies, createCurrency, getCurrency, updateCurrency, deleteCurrency, addExchangeRate, deleteExchangeRate } from './currency.controller.js';

const r = Router();

r.get('/', listCurrencies);
r.post('/', createCurrency);
r.get('/:id', getCurrency);
r.put('/:id', updateCurrency);
r.delete('/:id', deleteCurrency);

// Exchange rates
r.get('/:id/rates', getCurrency); // reuse get to include rates
r.post('/:id/rates', addExchangeRate);
r.delete('/:id/rates/:rateId', deleteExchangeRate);

export default r;
