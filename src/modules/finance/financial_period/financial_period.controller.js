import FinancialPeriodService from './financial_period.service.js';
import { success, error } from '../../../utils/apiResponse.js';

export const FinancialPeriodController = {
    async getPeriods(req, res) {
        try {
            const companyId = req.auth.companyID;
            const filters = {
                status: req.query.status,
                year: req.query.year,
                searchTerm: req.query.searchTerm
            };
            const data = await FinancialPeriodService.getPeriods(companyId, filters);
            return success(res, 'Financial Periods fetched', data);
        } catch (err) {
            return error(res, err.message, 500);
        }
    },

    async createPeriod(req, res) {
        try {
            const companyId = req.auth.companyID;
            // No body needed as it calculates next period automatically, 
            // but if we support manual creation later, we can read req.body.
            const data = await FinancialPeriodService.createPeriod(companyId);
            return success(res, 'New Financial Period created', data, 201);
        } catch (err) {
            console.error('[FinancialPeriodController] createPeriod error:', err && err.stack ? err.stack : err);
            return error(res, err.message, 500);
        }
    },

    async openPeriod(req, res) {
        try {
            const companyId = req.auth.companyID;
            const { id } = req.params;
            const data = await FinancialPeriodService.openPeriod(companyId, id, req.auth.user);
            return success(res, `Period ${id} opened`, data);
        } catch (err) {
            return error(res, err.message, 500);
        }
    },

    async closePeriod(req, res) {
        try {
            const companyId = req.auth.companyID;
            const { id } = req.params;
            // userName from token if available, else user ID
            const userName = req.auth.user;
            const data = await FinancialPeriodService.closePeriod(companyId, id, req.auth.user, userName);
            return success(res, `Period ${id} closed`, data);
        } catch (err) {
            return error(res, err.message, 500);
        }
    },

    async getFiscalSettings(req, res) {
        try {
            const companyId = req.auth.companyID;
            const data = await FinancialPeriodService.getFiscalSettings(companyId);
            return success(res, 'Fiscal Settings fetched', data || { fiscal_year_start_month: 1 }); // Default default
        } catch (err) {
            return error(res, err.message, 500);
        }
    },

    async saveFiscalSettings(req, res) {
        try {
            const companyId = req.auth.companyID;
            const { fiscalStartMonth } = req.body;
            if (!fiscalStartMonth || fiscalStartMonth < 1 || fiscalStartMonth > 12) {
                return error(res, 'Invalid month', 400);
            }
            const data = await FinancialPeriodService.saveFiscalSettings(companyId, fiscalStartMonth);
            return success(res, 'Fiscal Settings saved', data);
        } catch (err) {
            return error(res, err.message, 500);
        }
    },
};

export default FinancialPeriodController;
