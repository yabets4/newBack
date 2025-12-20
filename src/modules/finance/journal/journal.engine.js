import pool from '../../../loaders/db.loader.js';
import JournalModel from './journal.model.js';

export const JournalEngine = {
  async post(companyId, journalId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const journal = await JournalModel.findById(companyId, journalId);
      if (!journal) throw new Error('Journal not found');
      if (journal.status === 'Posted') throw new Error('Journal already posted');

      // Validate balanced again at engine level
      const totalDebit = (journal.lines || []).reduce((s, l) => s + (Number(l.debit) || 0), 0);
      const totalCredit = (journal.lines || []).reduce((s, l) => s + (Number(l.credit) || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.0001) {
        throw new Error('Journal lines must balance before posting');
      }

      // Fetch account info for validations and determine posting signs
      const accountIds = [...new Set((journal.lines || []).map(l => l.account_id))];
      const accountsRes = await client.query(`SELECT account_id, account_type FROM chart_of_accounts WHERE company_id = $1 AND account_id = ANY($2::text[])`, [companyId, accountIds]);
      const accountsMap = new Map(accountsRes.rows.map(r => [r.account_id, r.account_type]));

      // Validate all accounts exist
      for (const aid of accountIds) {
        if (!accountsMap.has(aid)) {
          throw new Error(`Account not found: ${aid}`);
        }
      }

      // Insert ledger entries and update ledger_balances
      let lineIdx = 1;
      for (const line of journal.lines) {
        const debit = Number(line.debit) || 0;
        const credit = Number(line.credit) || 0;
        const amount = debit - credit; // positive for net debit, negative for net credit
        const accountType = accountsMap.get(line.account_id) || null;

        // Determine posting amount for running balance depending on account type
        let balanceDelta = 0;
        if (accountType === 'Asset' || accountType === 'Expense') {
          // increase on debit
          balanceDelta = debit - credit;
        } else {
          // Liabilities, Equity, Revenue increase on credit
          balanceDelta = credit - debit;
        }

        // Upsert ledger_balances
        const balRes = await client.query(`SELECT balance FROM ledger_balances WHERE company_id = $1 AND account_id = $2 FOR UPDATE`, [companyId, line.account_id]);
        if (balRes.rows.length === 0) {
          const newBal = balanceDelta;
          await client.query(`INSERT INTO ledger_balances (company_id, account_id, balance, updated_at) VALUES ($1, $2, $3, NOW())`, [companyId, line.account_id, newBal]);
          var runningBalance = newBal;
          // Keep chart_of_accounts.balance in sync (optional): update account balance column
          await client.query(`UPDATE chart_of_accounts SET balance = $3, updated_at = NOW() WHERE company_id = $1 AND account_id = $2`, [companyId, line.account_id, newBal]);
        } else {
          const newBal = Number(balRes.rows[0].balance) + balanceDelta;
          await client.query(`UPDATE ledger_balances SET balance = $3, updated_at = NOW() WHERE company_id = $1 AND account_id = $2`, [companyId, line.account_id, newBal]);
          var runningBalance = newBal;
          // Keep chart_of_accounts.balance in sync (optional): update account balance column
          await client.query(`UPDATE chart_of_accounts SET balance = $3, updated_at = NOW() WHERE company_id = $1 AND account_id = $2`, [companyId, line.account_id, newBal]);
        }

        // Insert ledger entry
        await client.query(
          `INSERT INTO ledger_entries (company_id, journal_id, journal_line_number, posting_date, account_id, debit, credit, amount, running_balance, description, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
          [companyId, journal.journal_id, lineIdx++, journal.journal_date || null, line.account_id, debit, credit, amount, runningBalance, line.description || journal.description || null]
        );
      }

      // Mark journal as Posted
      await client.query(`UPDATE journal_entries SET status = 'Posted', updated_at = NOW() WHERE company_id = $1 AND journal_id = $2`, [companyId, journal.journal_id]);

      await client.query('COMMIT');
      return await JournalModel.findById(companyId, journal.journal_id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

export default JournalEngine;
