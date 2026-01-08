import PayrollModel from './payroll.model.js';
import TransactionManager from '../transaction.manager.js';

const defaults = {
  payPeriod: null,
  grossPay: 0,
  employeeTaxes: 0,
  employerTaxes: 0,
  netPay: 0,
  totalCost: 0,
  postingDate: null,
};

const PayrollService = {
  async getSummary(companyId) {
    const latest = await PayrollModel.latest(companyId);
    if (!latest) return { ...defaults };
    return {
      payPeriod: latest.pay_period,
      grossPay: Number(latest.gross_pay || 0),
      employeeTaxes: Number(latest.employee_taxes || 0),
      employerTaxes: Number(latest.employer_taxes || 0),
      netPay: Number(latest.net_pay || 0),
      totalCost: Number(latest.total_cost || 0),
      postingDate: latest.posting_date,
    };
  },

  async getHistory(companyId) {
    const rows = await PayrollModel.list(companyId);
    return rows.map(r => ({
      id: r.id,
      payPeriod: r.pay_period,
      totalCost: Number(r.total_cost || 0),
      postingDate: r.posting_date,
      grossPay: Number(r.gross_pay || 0),
      netPay: Number(r.net_pay || 0),
      employeeTaxes: Number(r.employee_taxes || 0),
      employerTaxes: Number(r.employer_taxes || 0),
    }));
  },

  async postRun(companyId, payload) {
    const clean = {
      payPeriod: payload.payPeriod,
      totalCost: Number(payload.totalCost || 0),
      postingDate: payload.postingDate || new Date().toISOString().slice(0, 10),
      grossPay: Number(payload.grossPay || 0),
      netPay: Number(payload.netPay || 0),
      employeeTaxes: Number(payload.employeeTaxes || 0),
      employerTaxes: Number(payload.employerTaxes || 0),
    };

    // Use postingDate for validation
    clean.date = clean.postingDate;

    // Delegate to Transaction Manager
    const result = await TransactionManager.handleEvent(companyId, 'PAYROLL_RUN_CREATE', clean, 'system');

    // Map result back to expected format
    const inserted = result.businessRecord;
    return inserted ? {
      id: inserted.id,
      payPeriod: inserted.pay_period,
      totalCost: Number(inserted.total_cost || 0),
      postingDate: inserted.posting_date,
      grossPay: Number(inserted.gross_pay || 0),
      netPay: Number(inserted.net_pay || 0),
      employeeTaxes: Number(inserted.employee_taxes || 0),
      employerTaxes: Number(inserted.employer_taxes || 0),
    } : null;
  },

  async reverseRun(companyId, runId, reason, user) {
    return await TransactionManager.reverseTransaction(companyId, 'PAYROLL', runId, reason, user);
  },

  async deleteRun(companyId, runId) {
    throw new Error('Deletion of posted payroll runs is disabled. Use reversal.');
  }
};

export default PayrollService;
