import pool from '../../loaders/db.loader.js';
import FinancialPeriodService from './financial_period/financial_period.service.js';
import BudgetService from './budget/budget.service.js';
import MappingService from './journal/mapping.service.js';
import JournalModel from './journal/journal.model.js';

// Import Domain Models
// Import Domain Models
// Import Domain Models
import ApModel from './ap/ap.model.js';
import ArModel from './ar/ar.model.js';
import PayrollModel from './payroll/payroll.model.js';
import { AssetsModel } from './fixedAsset/asset.model.js'; // Note named export
import LoanModel from './loan/loan.model.js';
// Will import others as we expand: ...

export const TransactionManager = {
    /**
     * Main entry point for financial transactions.
     * @param {string} companyId
     * @param {string} eventType - e.g. 'AP_INVOICE_CREATE', 'AR_INVOICE_CREATE'
     * @param {object} payload - Business data (invoice, payment, etc)
     * @param {string} user - User performing the action
     */
    async handleEvent(companyId, eventType, payload, user) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Validate Financial Period
            // Assume payload has a relevant date, e.g., invoice_date, payment_date
            const txDate = payload.date || payload.invoice_date || payload.payment_date || new Date();
            await FinancialPeriodService.validateDate(companyId, txDate);

            // 2. Resolve Accounting Mapping
            // We need to know which accounts will be hit to validate budget
            const journalLines = await MappingService.apply(companyId, eventType, payload);
            if (!journalLines || journalLines.length === 0) {
                throw new Error(`No accounting mapping found for event ${eventType}`);
            }

            // 3. Validate Budget (for Expense accounts involved in Debit)
            // Iterate lines, if debit > 0, check budget
            for (const line of journalLines) {
                if (line.debit > 0) {
                    // TODO: Optimization - cache budget check or batch it
                    await BudgetService.checkAvailability(companyId, line.account_id, line.debit, txDate);
                }
            }

            // 4. Perform Business Action
            let businessRecord;
            switch (eventType) {
                case 'AP_INVOICE_CREATE':
                    businessRecord = await ApModel.insertInvoice(companyId, payload, client);
                    businessRecord.source_module = 'AP';
                    break;
                case 'AR_INVOICE_CREATE':
                    businessRecord = await ArModel.insertInvoice(companyId, payload, client);
                    businessRecord.source_module = 'AR';
                    break;
                case 'PAYROLL_RUN_CREATE':
                    businessRecord = await PayrollModel.insert(companyId, payload, client);
                    businessRecord.source_module = 'PAYROLL';
                    // adapter for common id field if needed, payroll uses .id
                    break;
                case 'FIXED_ASSET_CREATE':
                    businessRecord = await AssetsModel.insert(companyId, payload, client);
                    businessRecord.source_module = 'ASSET';
                    businessRecord.invoice_id = businessRecord.asset_id; // adapter for common reference
                    break;
                case 'LOAN_CREATE':
                    businessRecord = await LoanModel.insert(companyId, payload, client);
                    businessRecord.source_module = 'LOAN';
                    businessRecord.invoice_id = businessRecord.id;
                    break;
                case 'LIABILITY_CREATE':
                    businessRecord = await LoanModel.insertLiability(companyId, payload, client);
                    businessRecord.source_module = 'LIABILITY';
                    businessRecord.invoice_id = businessRecord.id;
                    break;
                // Case AR, PAYROLL, etc.
                default:
                    throw new Error(`Unknown event type ${eventType}`);
            }

            // 5. Generate and Insert Journal Entry
            const journalPayload = {
                journal_date: txDate,
                description: `Auto-generated for ${eventType} - Ref: ${businessRecord.invoice_number || businessRecord.id}`, // Generic ref
                status: 'Posted', // Auto-post
                lines: journalLines,
                source_module: businessRecord.source_module || eventType.split('_')[0],
                source_ref_id: businessRecord.invoice_id || businessRecord.id
            };

            // We call JournalModel.insert with our client to share transaction
            const journalEntry = await JournalModel.insert(companyId, journalPayload, client);

            await client.query('COMMIT');
            return { businessRecord, journalEntry };

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('[TransactionManager] Transaction Failed:', err);
            throw err;
        } finally {
            client.release();
        }
    },

    /**
     * Reverses a financial process (e.g. cancels an invoice).
     * 1. Validates reversal date is in open period.
     * 2. Finds original Journal Entry.
     * 3. Creates Reversal Journal Entry (swap Debit/Credit).
     * 4. Updates Business Record Status (if supported).
     */
    async reverseTransaction(companyId, sourceModule, sourceRefId, reason, user) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const now = new Date();
            // 1. Validate Reversal Date (Now) is in Open Period
            await FinancialPeriodService.validateDate(companyId, now);

            // 2. Find Original Journal (Latest posted for this ref)
            // We assume MappingService or JournalModel can filter like this.
            // Since JournalModel doesn't have findBySource, we query directly or add it.
            // Using direct query here for speed, better to add to Model later.
            const journalRes = await client.query(
                `SELECT * FROM journal_entries 
                 WHERE company_id = $1 AND source_module = $2 AND source_ref_id = $3 AND status = 'Posted'
                 ORDER BY created_at DESC LIMIT 1`,
                [companyId, sourceModule, sourceRefId]
            );

            if (journalRes.rows.length === 0) {
                // If no journal, maybe it wasn't posted or old data?
                // Depending on strictness, we might allow business-only reversal, but here we enforce unified control.
                throw new Error(`Cannot reverse: No posted journal found for ${sourceModule} ref ${sourceRefId}`);
            }

            const originalJournal = await JournalModel.findById(companyId, journalRes.rows[0].journal_id);

            // 3. Create Reversal Lines (Swap Dr/Cr)
            const reversalLines = originalJournal.lines.map(l => ({
                account_id: l.account_id,
                description: `Reversal: ${l.description}`,
                debit: Number(l.credit) || 0,
                credit: Number(l.debit) || 0
            }));

            // 4. Create Reversal Journal
            const journalPayload = {
                journal_date: now,
                description: `Reversal of ${originalJournal.journal_number || originalJournal.journal_id}: ${reason}`,
                status: 'Posted',
                lines: reversalLines,
                source_module: `${sourceModule}_REVERSAL`,
                source_ref_id: sourceRefId
            };

            const reversalJournal = await JournalModel.insert(companyId, journalPayload, client);

            // 5. Update Business Record Status via Model
            // This requires the Manager to know about specific Models again, or we delegate?
            // Switch case similar to handleEvent
            switch (sourceModule) {
                case 'AP':
                case 'AP_INVOICE_CREATE': // handle both variations
                    await ApModel.updateStatus(companyId, sourceRefId, 'Reversed'); // or 'Voided'
                    break;
                case 'AR':
                case 'AR_INVOICE_CREATE':
                    // await ArModel.updateStatus(companyId, sourceRefId, 'Reversed');
                    // Ensure ArModel supports this
                    break;
                // Add others: PAYROLL, ASSET, LOAN...
                default:
                    // If no specific handler, we assume just Journal Reversal is enough?
                    // No, we should update the record if possible. Warning log?
                    console.warn(`[TransactionManager] No business status update handler for ${sourceModule}`);
            }

            await client.query('COMMIT');
            return reversalJournal;

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('[TransactionManager] Reversal Failed:', err);
            throw err;
        } finally {
            client.release();
        }
    }
};

export default TransactionManager;
