import { Router } from 'express';
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountTree,
} from './coa.controller.js';
import { CheckTierLimit } from '../../../middleware/checkTierLimit.middleware.js';

const r = Router();

// List & tree
r.get('/', getAccounts);
r.get('/tree', getAccountTree);

// Single
r.get('/:id', getAccount);

// Create / Update / Delete
r.post('/', CheckTierLimit('accounts'), createAccount);
r.put('/:id', updateAccount);
r.delete('/:id', deleteAccount);

export default r;
