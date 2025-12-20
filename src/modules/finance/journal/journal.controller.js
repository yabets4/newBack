import { JournalService } from './journal.service.js';
import { ok, created, notFound, internal } from '../../../utils/apiResponse.js';
import pool from '../../../loaders/db.loader.js';

export async function getJournals(req, res) {
  try {
    const { companyID } = req.auth;
    const rows = await JournalService.getJournals(companyID);
    return ok(res, rows);
  } catch (err) {
    console.error('[JournalController] getJournals error:', err);
    return internal(res, err.message || 'Error fetching journals');
  }
}

export async function getJournal(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const row = await JournalService.getJournal(companyID, id);
    if (!row) return notFound(res, 'Journal not found');
    return ok(res, row);
  } catch (err) {
    console.error('[JournalController] getJournal error:', err);
    return internal(res, err.message || 'Error fetching journal');
  }
}

export async function createJournal(req, res) {
  try {
    const { companyID } = req.auth;
    const payload = { ...req.body };
    const createdJournal = await JournalService.createJournal(companyID, payload);
    return created(res, createdJournal);
  } catch (err) {
    console.error('[JournalController] createJournal error:', err);
    return internal(res, err.message || 'Error creating journal');
  }
}

export async function updateJournal(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const payload = { ...req.body };
    const updated = await JournalService.updateJournal(companyID, id, payload);
    if (!updated) return notFound(res, 'Journal not found');
    return ok(res, updated);
  } catch (err) {
    console.error('[JournalController] updateJournal error:', err);
    return internal(res, err.message || 'Error updating journal');
  }
}

export async function postJournal(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const posted = await JournalService.postJournal(companyID, id);
    if (!posted) return notFound(res, 'Journal not found');
    return ok(res, posted);
  } catch (err) {
    console.error('[JournalController] postJournal error:', err);
    return internal(res, err.message || 'Error posting journal');
  }
}

// Return posted ledger entries for the company (optionally filtered)
export async function getLedgerEntries(req, res) {
  try {
    const { companyID } = req.auth;
    const { account, startDate, endDate } = req.query;
    // Build base query
    let sql = `SELECT id, journal_id, journal_line_number, posting_date, account_id, debit, credit, amount, running_balance, description, created_at FROM ledger_entries WHERE company_id = $1`;
    const params = [companyID];
    let idx = 2;
    if (account) {
      sql += ` AND account_id = $${idx++}`;
      params.push(account);
    }
    if (startDate) {
      sql += ` AND posting_date >= $${idx++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND posting_date <= $${idx++}`;
      params.push(endDate);
    }
    sql += ` ORDER BY posting_date DESC, id DESC LIMIT 1000`;

    const resDb = await pool.query(sql, params);
    return ok(res, resDb.rows);
  } catch (err) {
    console.error('[JournalController] getLedgerEntries error:', err);
    return internal(res, err.message || 'Error fetching ledger entries');
  }
}

export async function deleteJournal(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const deleted = await JournalService.deleteJournal(companyID, id);
    if (!deleted) return notFound(res, 'Journal not found');
    return ok(res, { message: 'Journal deleted', deleted });
  } catch (err) {
    console.error('[JournalController] deleteJournal error:', err);
    return internal(res, err.message || 'Error deleting journal');
  }
}

export default {
  getJournals,
  getJournal,
  createJournal,
  updateJournal,
  postJournal,
  deleteJournal,
};
