import { addMonths } from 'date-fns';
import LoanModel from './loan.model.js';
import TransactionManager from '../transaction.manager.js';

export const LoanService = {
  async list(companyId) {
    return await LoanModel.list(companyId);
  },

  async get(companyId, id) {
    return await LoanModel.findById(companyId, id);
  },

  async create(companyId, payload) {
    // normalize payload keys to model expectations
    const p = {
      name: payload.name,
      lender: payload.lender,
      originalAmount: payload.originalAmount || payload.original_amount || 0,
      outstandingBalance: payload.outstandingBalance || payload.outstanding_balance || payload.originalAmount || 0,
      interestRate: payload.interestRate || payload.interest_rate || null,
      termInMonths: payload.termInMonths || payload.term_in_months || null,
      startDate: payload.startDate || payload.start_date || null,
      nextPaymentDate: payload.nextPaymentDate || payload.next_payment_date || null,
      status: payload.status || 'Active',
      date: payload.startDate || payload.start_date // for validation
    };

    // Delegate to TransactionManager
    const result = await TransactionManager.handleEvent(companyId, 'LOAN_CREATE', p, 'system');
    return result.businessRecord;
  },

  async amortizationSchedule(companyId, id) {
    const loan = await LoanModel.findById(companyId, id);
    if (!loan) return null;
    const monthlyRate = Number(loan.interest_rate || loan.interestRate || 0) / 100 / 12;
    const n = Number(loan.term_in_months || loan.termInMonths || 0);
    const principal = Number(loan.original_amount || loan.originalAmount || 0);
    const monthlyPayment = n > 0 ? principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1) : 0;

    const schedule = [];
    let beginningBalance = principal;
    const start = loan.start_date || loan.startDate ? new Date(loan.start_date || loan.startDate) : new Date();

    for (let i = 1; i <= n; i++) {
      const interestPayment = beginningBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      const endingBalance = Math.max(0, beginningBalance - principalPayment);
      schedule.push({
        paymentNumber: i,
        paymentDate: addMonths(start, i).toISOString().slice(0, 10),
        beginningBalance,
        interestPayment,
        principalPayment,
        endingBalance,
      });
      beginningBalance = endingBalance;
    }
    return schedule;
  },

  async listLiabilities(companyId) {
    return await LoanModel.listLiabilities(companyId);
  },

  async createLiability(companyId, payload) {
    const p = {
      name: payload.name,
      type: payload.type,
      creditor: payload.creditor,
      amount: payload.amount,
      dueDate: payload.dueDate,
      status: payload.status || 'Current',
      date: new Date() // default date for liability creation? or use due date? use now for transaction
    };
    const result = await TransactionManager.handleEvent(companyId, 'LIABILITY_CREATE', p, 'system');
    return result.businessRecord;
  },

  async markLiabilityPaid(companyId, id) {
    return await LoanModel.markLiabilityPaid(companyId, id);
  },

  async reverseLoan(companyId, loanId, reason, user) {
    return await TransactionManager.reverseTransaction(companyId, 'LOAN', loanId, reason, user);
  },

  async reverseLiability(companyId, liabilityId, reason, user) {
    return await TransactionManager.reverseTransaction(companyId, 'LIABILITY', liabilityId, reason, user);
  },

  async deleteLoan(companyId, loanId) {
    throw new Error('Deletion of loans is disabled. Use reversal.');
  },

  async deleteLiability(companyId, liabilityId) {
    throw new Error('Deletion of liabilities is disabled. Use reversal.');
  }
};

export default LoanService;
