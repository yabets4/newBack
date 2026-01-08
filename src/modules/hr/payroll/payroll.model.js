import pool from '../../../loaders/db.loader.js';

const PayrollModel = {
  async getCompensation(companyId, employeeId) {
    const res = await pool.query(`SELECT * FROM compensation_settings WHERE company_id = $1 AND employee_id = $2 LIMIT 1`, [companyId, employeeId]);
    return res.rows[0] || null;
  },

  async upsertCompensation(companyId, employeeId, payload) {
    const res = await pool.query(
      `INSERT INTO compensation_settings (company_id, employee_id, base_salary, pay_frequency, bank_name, bank_account, payroll_data, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
       ON CONFLICT (company_id, employee_id) DO UPDATE SET base_salary = $3, pay_frequency = $4, bank_name = $5, bank_account = $6, payroll_data = $7, updated_at = NOW()
       RETURNING *`,
      [companyId, employeeId, payload.base_salary || 0, payload.pay_frequency || null, payload.bank_name || null, payload.bank_account || null, payload.payroll_data || {}]
    );
    return res.rows[0] || null;
  },

  async insertPayrollRun(companyId, payload) {
    const res = await pool.query(
      `INSERT INTO payroll_runs (company_id, pay_period, gross_pay, total_tax, net_pay, status, metadata, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
      [companyId, payload.payPeriod, payload.grossPay || 0, payload.totalTax || 0, payload.netPay || 0, payload.status || 'Posted', payload.metadata || {}]
    );
    return res.rows[0] || null;
  },

  async insertPayslip(companyId, payrollRunId, payload) {
    const res = await pool.query(
      `INSERT INTO payslips (company_id, payroll_run_id, employee_id, gross_pay, taxes, net_pay, data, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
      [companyId, payrollRunId, payload.employeeId, payload.grossPay || 0, payload.taxes || 0, payload.netPay || 0, payload.data || {}]
    );
    return res.rows[0] || null;
  },

  async listPayrollRuns(companyId) {
    const res = await pool.query(`SELECT * FROM payroll_runs WHERE company_id = $1 ORDER BY created_at DESC`, [companyId]);
    return res.rows || [];
  },

  async getPayrollRun(companyId, id) {
    const res = await pool.query(`SELECT * FROM payroll_runs WHERE company_id = $1 AND id = $2 LIMIT 1`, [companyId, id]);
    return res.rows[0] || null;
  },

  async listPayslips(companyId, filters = {}) {
    const res = await pool.query(`SELECT * FROM payslips WHERE company_id = $1 ORDER BY created_at DESC`, [companyId]);
    return res.rows || [];
  },

  async getPayslip(companyId, id) {
    const res = await pool.query(`SELECT * FROM payslips WHERE company_id = $1 AND id = $2 LIMIT 1`, [companyId, id]);
    return res.rows[0] || null;
  }
};

export default PayrollModel;
