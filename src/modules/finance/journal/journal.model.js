import pool from '../../../loaders/db.loader.js';

export const JournalModel = {
  async findAll(companyId) {
    const res = await pool.query(
      `SELECT * FROM journal_entries WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    );
    return res.rows;
  },

  async findById(companyId, journalId) {
    const entryRes = await pool.query(
      `SELECT * FROM journal_entries WHERE company_id = $1 AND journal_id = $2 LIMIT 1`,
      [companyId, journalId]
    );
    const entry = entryRes.rows[0] || null;
    if (!entry) return null;

    const linesRes = await pool.query(
      `SELECT * FROM journal_lines WHERE company_id = $1 AND journal_id = $2 ORDER BY line_number`,
      [companyId, journalId]
    );
    entry.lines = linesRes.rows;
    return entry;
  },

  async insert(companyId, data, externalClient = null) {
    const client = externalClient || await pool.connect();
    const shouldRelease = !externalClient;
    try {
      if (shouldRelease) await client.query('BEGIN');

      // Model-level validation: ensure lines balance
      if (!Array.isArray(data.lines) || data.lines.length === 0) {
        throw new Error('Journal must have at least one line');
      }
      const totalDebit = data.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
      const totalCredit = data.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.0001) {
        throw new Error('Journal lines must balance (total debit must equal total credit)');
      }

      const nextRes = await client.query(
        `UPDATE companies SET next_journal_number = next_journal_number + 1 WHERE company_id = $1 RETURNING next_journal_number`,
        [companyId]
      );
      const nextNum = nextRes.rows[0]?.next_journal_number || Date.now();
      const journal_id = `JNL-${String(nextNum).padStart(6, '0')}`;

      await client.query(
        `INSERT INTO journal_entries (company_id, journal_id, journal_number, journal_date, description, status, source_module, source_ref_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
        [companyId, journal_id, data.journal_number || null, data.journal_date || null, data.description || null, data.status || 'Draft', data.source_module || null, data.source_ref_id || null]
      );

      // Insert lines
      if (Array.isArray(data.lines)) {
        let idx = 1;
        for (const l of data.lines) {
          await client.query(
            `INSERT INTO journal_lines (company_id, journal_id, line_number, account_id, description, debit, credit, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
            [companyId, journal_id, idx++, l.account_id || null, l.description || null, l.debit || 0, l.credit || 0]
          );
        }
      }


      if (shouldRelease) await client.query('COMMIT');
      return await this.findById(companyId, journal_id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(companyId, journalId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Prevent updating posted journals
      const beforeRes = await client.query(`SELECT status FROM journal_entries WHERE company_id = $1 AND journal_id = $2 LIMIT 1`, [companyId, journalId]);
      if (beforeRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      if (beforeRes.rows[0].status === 'Posted') {
        await client.query('ROLLBACK');
        throw new Error('Cannot modify a posted journal entry');
      }

      // If lines provided, validate balance at model level
      if (Array.isArray(data.lines)) {
        const totalDebit = data.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
        const totalCredit = data.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.0001) {
          await client.query('ROLLBACK');
          throw new Error('Journal lines must balance (total debit must equal total credit)');
        }
      }
      const updateRes = await client.query(
        `UPDATE journal_entries SET
           journal_number = $3,
           journal_date = $4,
           description = $5,
           status = $6,
           updated_at = NOW()
         WHERE company_id = $1 AND journal_id = $2
         RETURNING *`,
        [companyId, journalId, data.journal_number || null, data.journal_date || null, data.description || null, data.status || 'Draft']
      );

      // Replace lines if provided
      if (Array.isArray(data.lines)) {
        await client.query(`DELETE FROM journal_lines WHERE company_id = $1 AND journal_id = $2`, [companyId, journalId]);
        let idx = 1;
        for (const l of data.lines) {
          await client.query(
            `INSERT INTO journal_lines (company_id, journal_id, line_number, account_id, description, debit, credit, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
            [companyId, journalId, idx++, l.account_id || null, l.description || null, l.debit || 0, l.credit || 0]
          );
        }
      }

      await client.query('COMMIT');
      return await this.findById(companyId, journalId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async remove(companyId, journalId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const before = await client.query(`SELECT * FROM journal_entries WHERE company_id = $1 AND journal_id = $2 LIMIT 1`, [companyId, journalId]);
      if (before.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      if (before.rows[0].status === 'Posted') {
        await client.query('ROLLBACK');
        throw new Error('Cannot delete a posted journal entry');
      }

      await client.query(`DELETE FROM journal_lines WHERE company_id = $1 AND journal_id = $2`, [companyId, journalId]);
      await client.query(`DELETE FROM journal_entries WHERE company_id = $1 AND journal_id = $2`, [companyId, journalId]);

      await client.query('COMMIT');
      return before.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

export default JournalModel;
