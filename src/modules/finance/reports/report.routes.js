import { Router } from 'express';
import { getIncomeStatement, getBalanceSheet, getCashFlow, postCustomReport, getCustomReportAccounts, getKpiDashboard } from './report.controller.js';

const r = Router();

// Income Statement
r.get('/income-statement', getIncomeStatement);

// Balance Sheet
r.get('/balance-sheet', getBalanceSheet);

// Cash Flow
r.get('/cash-flow', getCashFlow);

// Custom report
r.post('/custom-report', postCustomReport);
r.get('/custom-report/accounts', getCustomReportAccounts);

// KPI Dashboard
r.get('/kpi-dashboard', getKpiDashboard);

export default r;
