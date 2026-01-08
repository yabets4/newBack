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

import permission from "../../../middleware/permission.middleware.js";

const r = Router();

const canRead = permission(['finance.coa.read.all', 'finance.read.all']);
const canCreate = permission(['finance.coa.create', 'finance.create']);
const canUpdate = permission(['finance.coa.update', 'finance.update']);
const canDelete = permission(['finance.coa.delete', 'finance.delete']);

// List & tree
r.get('/', canRead, getAccounts);
r.get('/tree', canRead, getAccountTree);

// Single
r.get('/:id', canRead, getAccount);

// Create / Update / Delete
r.post('/', canCreate, CheckTierLimit('accounts'), createAccount);
r.put('/:id', canUpdate, updateAccount);
r.delete('/:id', canDelete, deleteAccount);

export default r;
