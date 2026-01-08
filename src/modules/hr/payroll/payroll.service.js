import PayrollModel from './payroll.model.js';

const PayrollService = {
  async getCompensation(companyId, employeeId) {
    const row = await PayrollModel.getCompensation(companyId, employeeId);
    if (!row) return null;
    return {
      employeeId: row.employee_id,
      baseSalary: Number(row.base_salary || 0),
      payFrequency: row.pay_frequency,
      bankName: row.bank_name,
      bankAccount: row.bank_account,
      payrollData: row.payroll_data || {},
    };
  },

  async upsertCompensation(companyId, employeeId, payload) {
    const r = await PayrollModel.upsertCompensation(companyId, employeeId, payload);
    return r ? {
      employeeId: r.employee_id,
      baseSalary: Number(r.base_salary || 0),
      payFrequency: r.pay_frequency,
      bankName: r.bank_name,
      bankAccount: r.bank_account,
      payrollData: r.payroll_data || {},
    } : null;
  },

  async processPayroll(companyId, payload) {
    // payload: { payPeriod, entries: [{ employeeId, grossPay, taxes, netPay, data }] }
    const run = await PayrollModel.insertPayrollRun(companyId, {
      payPeriod: payload.payPeriod,
      grossPay: payload.grossPay || payload.entries?.reduce((s,e)=>s+Number(e.grossPay||0),0) || 0,
      totalTax: payload.totalTax || payload.entries?.reduce((s,e)=>s+Number(e.taxes||0),0) || 0,
      netPay: payload.netPay || payload.entries?.reduce((s,e)=>s+Number(e.netPay||0),0) || 0,
      status: payload.status || 'Posted',
      metadata: payload.metadata || {}
    });

    if (!run) throw new Error('Failed to create payroll run');

    const payslips = [];
    if (Array.isArray(payload.entries)) {
      for (const e of payload.entries) {
        const ps = await PayrollModel.insertPayslip(companyId, run.id, {
          employeeId: e.employeeId,
          grossPay: e.grossPay || 0,
          taxes: e.taxes || 0,
          netPay: e.netPay || 0,
          data: e.data || {}
        });
        if (ps) payslips.push(ps);
      }
    }

    return { run, payslips };
  },

  async listPayrollRuns(companyId) {
    return await PayrollModel.listPayrollRuns(companyId);
  },

  async getPayrollRun(companyId, id) {
    return await PayrollModel.getPayrollRun(companyId, id);
  },

  async listPayslips(companyId) {
    return await PayrollModel.listPayslips(companyId);
  },

  async getPayslip(companyId, id) {
    return await PayrollModel.getPayslip(companyId, id);
  }
};

export default PayrollService;
