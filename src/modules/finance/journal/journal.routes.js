import { Router } from 'express';
import {
  getJournals,
  getJournal,
  createJournal,
  updateJournal,
  postJournal,
  deleteJournal,
  getLedgerEntries,
} from './journal.controller.js';
import { CheckTierLimit } from '../../../middleware/checkTierLimit.middleware.js';

import permission from "../../../middleware/permission.middleware.js";

const r = Router();

const canRead = permission(['finance.journal.read.all', 'finance.read.all']);
const canCreate = permission(['finance.journal.create', 'finance.create']); // includes 'post' action usually, or we use update for post
const canUpdate = permission(['finance.journal.update', 'finance.update']);
const canDelete = permission(['finance.journal.delete', 'finance.delete']);

// Return journal list
r.get('/', canRead, getJournals);

r.get('/entries', canRead, getLedgerEntries);

// Get single journal by id (place after static routes)
r.get('/:id', canRead, getJournal);
r.post('/', canCreate, CheckTierLimit('journals'), createJournal);
r.put('/:id', canUpdate, updateJournal);
r.post('/:id/post', canUpdate, postJournal); // Posting maps to update
r.delete('/:id', canDelete, deleteJournal);

export default r;
