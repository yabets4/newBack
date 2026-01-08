import pool from '../../../loaders/db.loader.js';

const PayrollModel = {
  async list(companyId) {
    const res = await pool.query(
      `SELECT * FROM payroll_postings WHERE company_id = $1 ORDER BY posting_date DESC, created_at DESC`,
      [companyId]
    );
    return res.rows || [];
  },

  async latest(companyId) {
    const res = await pool.query(
      `SELECT * FROM payroll_postings WHERE company_id = $1 ORDER BY posting_date DESC, created_at DESC LIMIT 1`,
      [companyId]
    );
    return res.rows[0] || null;
  },

  async insert(companyId, payload, externalClient = null) {
    const client = externalClient || pool;
    const res = await client.query(
      `INSERT INTO payroll_postings (company_id, pay_period, total_cost, posting_date, gross_pay, net_pay, employee_taxes, employer_taxes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, 'Posted') RETURNING *`,
      [
        companyId,
        payload.payPeriod,
        payload.totalCost,
        payload.postingDate,
        payload.grossPay,
        payload.netPay,
        payload.employeeTaxes,
        payload.employerTaxes,
      ]
    );
    return res.rows[0] || null;
  },

  async updateStatus(companyId, id, status) {
    const res = await pool.query(
      `UPDATE payroll_postings SET status = $3 WHERE company_id = $1 AND id = $2 RETURNING *`,
      [companyId, id, status]
    );
    return res.rows[0] || null;
  }
};

export default PayrollModel;
