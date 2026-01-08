import JournalModel from './journal.model.js';
import MappingService from './mapping.service.js';
import JournalEngine from './journal.engine.js';
import FinancialPeriodService from '../financial_period/financial_period.service.js';

export const JournalService = {
  async createJournal(companyId, payload) {
    console.log('[JournalService] createJournal for', companyId);
    if (!payload) throw new Error('Missing payload');

    // If this is an event-backed journal and lines not provided, apply mapping
    if (payload.event_type && (!Array.isArray(payload.lines) || payload.lines.length === 0)) {
      const mapped = await MappingService.apply(companyId, payload.event_type, payload);
      if (mapped && Array.isArray(mapped)) payload.lines = mapped;
    }

    if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
      throw new Error('Journal must have at least one line');
    }

    // Validate Financial Period
    if (payload.journal_date) {
      await FinancialPeriodService.validateDate(companyId, payload.journal_date);
    }

    // Validate balancing
    const totalDebit = payload.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = payload.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new Error('Journal lines must balance (total debit must equal total credit)');
    }

    try {
      const created = await JournalModel.insert(companyId, payload);

      // If client requested immediate posting (status === 'Posted' or auto_post flag), call engine
      if ((payload.auto_post === true) || (created && (created.status === 'Posted' || payload.status === 'Posted'))) {
        await JournalEngine.post(companyId, created.journal_id);
        return await JournalModel.findById(companyId, created.journal_id);
      }

      return created;
    } catch (err) {
      console.error('[JournalService] Error creating journal', err);
      throw err;
    }
  },

  async updateJournal(companyId, journalId, payload) {
    console.log('[JournalService] updateJournal', journalId);
    const existing = await JournalModel.findById(companyId, journalId);
    if (!existing) return null;

    if (Array.isArray(payload.lines)) {
      const totalDebit = payload.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
      const totalCredit = payload.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.0001) {
        throw new Error('Journal lines must balance (total debit must equal total credit)');
      }
    }

    // Validate Financial Period
    if (payload.journal_date) {
      await FinancialPeriodService.validateDate(companyId, payload.journal_date);
    }

    try {
      const updated = await JournalModel.update(companyId, journalId, payload);
      return updated;
    } catch (err) {
      console.error('[JournalService] Error updating journal', err);
      throw err;
    }
  },

  async deleteJournal(companyId, journalId) {
    console.log('[JournalService] deleteJournal', journalId);
    const existing = await JournalModel.findById(companyId, journalId);
    if (!existing) return null;
    if (existing.status === 'Posted') throw new Error('Cannot delete posted journal entry');

    const deleted = await JournalModel.remove(companyId, journalId);
    return deleted;
  },

  async postJournal(companyId, journalId) {
    console.log('[JournalService] postJournal', journalId);
    // Use JournalEngine to perform posting and ledger updates
    const result = await JournalEngine.post(companyId, journalId);
    return result;
  },

  async getJournals(companyId) {
    return await JournalModel.findAll(companyId);
  },

  async getJournal(companyId, journalId) {
    return await JournalModel.findById(companyId, journalId);
  },
};

export default JournalService;
