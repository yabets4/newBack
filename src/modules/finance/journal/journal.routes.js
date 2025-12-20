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

const r = Router();

// Return journal list
r.get('/', getJournals);

r.get('/entries', getLedgerEntries);

// Get single journal by id (place after static routes)
r.get('/:id', getJournal);
r.post('/', CheckTierLimit('journals'), createJournal);
r.put('/:id', updateJournal);
r.post('/:id/post', postJournal);
r.delete('/:id', deleteJournal);

export default r;
