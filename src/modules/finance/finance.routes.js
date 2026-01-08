import { Router } from 'express';
import auth from '../../middleware/auth.middleware.js';
import { authenticateJWT } from '../../middleware/jwt.middleware.js';
import { requestCounter } from '../../middleware/requestCounter.middleware.js';
import { CheckCompanyStatus } from '../../middleware/checkTierLimit.middleware.js';
import FixedaAsset from './fixedAsset/assets.routes.js';
import CoaRoutes from './coa/coa.routes.js';
import JournalRoutes from './journal/journal.routes.js';
import ApRoutes from './ap/ap.routes.js';
import CurrencyRoutes from './currency/currency.routes.js';
import ArRoutes from './ar/ar.routes.js';
import BudgetRoutes from './budget/budget.routes.js';
import ReportRoutes from './reports/report.routes.js';
import ForecastingRoutes from './forecasting/forecasting.routes.js';
import VarianceRoutes from './variance/variance.routes.js';
import LoanRoutes from './loan/loan.routes.js';
import PayrollRoutes from './payroll/payroll.routes.js';
import TaxRoutes from './tax/tax.routes.js';
import FinancialPeriodRoutes from './financial_period/financial_period.routes.js';

const r = Router(); r.use(CheckCompanyStatus, requestCounter);

r.use('/assets', FixedaAsset);
r.use('/coa', CoaRoutes);
r.use('/journal', JournalRoutes);
r.use('/ap', ApRoutes);
r.use('/currency', CurrencyRoutes);
r.use('/ar', ArRoutes);
r.use('/budget', BudgetRoutes);
r.use('/reports', ReportRoutes);
r.use('/forecasting', ForecastingRoutes);
r.use('/variance', VarianceRoutes);
r.use('/loan', LoanRoutes);
r.use('/payroll', PayrollRoutes);
r.use('/tax', TaxRoutes);
r.use('/periods', FinancialPeriodRoutes);

export default r;
