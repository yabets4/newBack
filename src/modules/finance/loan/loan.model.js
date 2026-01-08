import pool from '../../../loaders/db.loader.js';

const LoanModel = {
  async list(companyId) {
    const res = await pool.query(`SELECT * FROM loans WHERE company_id = $1 ORDER BY created_at DESC`, [companyId]);
    return res.rows || [];
  },

  async findById(companyId, id) {
    const res = await pool.query(`SELECT * FROM loans WHERE company_id = $1 AND id = $2 LIMIT 1`, [companyId, id]);
    return res.rows[0] || null;
  },

  async insert(companyId, payload, externalClient = null) {
    const client = externalClient || pool;
    const id = payload.id || `loan-${Date.now()}`;
    const res = await client.query(
      `INSERT INTO loans (id, company_id, name, lender, original_amount, outstanding_balance, interest_rate, term_in_months, start_date, next_payment_date, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW()) RETURNING *`,
      [id, companyId, payload.name || null, payload.lender || null, payload.originalAmount || 0, payload.outstandingBalance || payload.originalAmount || 0, payload.interestRate || null, payload.termInMonths || null, payload.startDate || null, payload.nextPaymentDate || null, payload.status || 'Active']
    );
    return res.rows[0] || null;
  },

  async updateStatus(companyId, id, status) {
    const res = await pool.query(`UPDATE loans SET status = $3, updated_at = NOW() WHERE company_id = $1 AND id = $2 RETURNING *`, [companyId, id, status]);
    return res.rows[0];
  },

  async listLiabilities(companyId) {
    const res = await pool.query(`SELECT * FROM liabilities WHERE company_id = $1 ORDER BY due_date NULLS LAST, created_at DESC`, [companyId]);
    return res.rows || [];
  },

  async insertLiability(companyId, payload, externalClient = null) {
    const client = externalClient || pool;
    const id = payload.id || `liab-${Date.now()}`;
    const res = await client.query(
      `INSERT INTO liabilities (id, company_id, name, type, creditor, amount, due_date, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) RETURNING *`,
      [id, companyId, payload.name || null, payload.type || null, payload.creditor || null, payload.amount || 0, payload.dueDate || null, payload.status || 'Current']
    );
    return res.rows[0] || null;
  },

  async markLiabilityPaid(companyId, id) {
    const res = await pool.query(`UPDATE liabilities SET status = 'Paid', updated_at = NOW() WHERE company_id = $1 AND id = $2 RETURNING *`, [companyId, id]);
    return res.rows[0] || null;
  },

  async updateLiabilityStatus(companyId, id, status) {
    const res = await pool.query(`UPDATE liabilities SET status = $3, updated_at = NOW() WHERE company_id = $1 AND id = $2 RETURNING *`, [companyId, id, status]);
    return res.rows[0];
  }
};

export default LoanModel;
