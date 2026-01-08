import FinancialPeriodModel from './financial_period.model.js';
import { startOfMonth, endOfMonth, parseISO, format, addMonths } from 'date-fns';

export const FinancialPeriodService = {
    async getPeriods(companyId, filters) {
        return await FinancialPeriodModel.findAll(companyId, filters);
    },

    async createPeriod(companyId) {
        try {
            // Determine next period range based on existing periods or fiscal settings
            const periods = await FinancialPeriodModel.findAll(companyId);

            // Find latest end date
            // periods are sorted by start_date DESC in model, so existing[0] is likely the latest start, 
            // but let's check end dates to be safe or reuse the sort order.
            // If we trust findAll order (DESC), the first one has the latest start date.

            let nextMonthStart;

            if (periods.length > 0) {
                const latestPeriod = periods[0]; // Assuming DESC sort
                // end_date might be a Date object from pg driver or a string
                const endDate = latestPeriod.end_date instanceof Date
                    ? latestPeriod.end_date
                    : parseISO(latestPeriod.end_date);
                nextMonthStart = startOfMonth(addMonths(endDate, 1));
            } else {
                // Fetch fiscal settings or default to Jan
                const settings = await FinancialPeriodModel.getFiscalSettings(companyId);
                const startMonth = settings?.fiscal_year_start_month || 1;
                const currentYear = new Date().getFullYear();
                // JavaScript months are 0-indexed (0=Jan, 11=Dec)
                // startMonth is 1-indexed (1=Jan) -> use startMonth - 1
                nextMonthStart = startOfMonth(new Date(currentYear, startMonth - 1, 1));
            }

            const nextMonthEnd = endOfMonth(nextMonthStart);
            const periodId = `FP${format(nextMonthStart, 'yyyyMM')}`;
            const periodName = format(nextMonthStart, 'MMMM yyyy');

            // Check if exists
            const existing = await FinancialPeriodModel.findById(companyId, periodId);
            if (existing) {
                throw new Error(`Period ${periodName} (${periodId}) already exists.`);
            }

            const newPeriod = {
                period_id: periodId,
                period_name: periodName,
                start_date: format(nextMonthStart, 'yyyy-MM-dd'),
                end_date: format(nextMonthEnd, 'yyyy-MM-dd'),
                status: 'Future'
            };

            return await FinancialPeriodModel.create(companyId, newPeriod);
        } catch (err) {
            console.error('[FinancialPeriodService] createPeriod error:', {
                companyId,
                err: err && err.stack ? err.stack : err.message || err,
            });
            throw err;
        }
    },

    async openPeriod(companyId, periodId, userId) {
        // 1. Check if period exists
        const period = await FinancialPeriodModel.findById(companyId, periodId);
        if (!period) throw new Error('Period not found');
        if (period.status === 'Open') throw new Error('Period is already Open');

        // 2. Close any conflicting currently open periods ?
        // Requirement "mostly one open period". Let's enforce single open period for strict ledger control.
        // OR allow multiple. The UI implies specific Open/Close actions.
        // Let's implementation strict mode: Start Transaction -> Close all Open -> Open Target -> Commit.

        // IMPL: Auto-close existing open periods
        await FinancialPeriodModel.closeOtherPeriods(companyId, periodId, 'System (Auto-Close)');

        // 3. Open this period
        return await FinancialPeriodModel.update(companyId, periodId, {
            status: 'Open',
            closing_date: null,
            closed_by: null
        });
    },

    async closePeriod(companyId, periodId, userId, userName) {
        const period = await FinancialPeriodModel.findById(companyId, periodId);
        if (!period) throw new Error('Period not found');
        if (period.status !== 'Open') throw new Error('Period is not Open');

        // Here we could add validation checks (unposted journals etc), 
        // but the UI creates a modal for that. Backend can assume if this is called, check is done or overridden.

        return await FinancialPeriodModel.update(companyId, periodId, {
            status: 'Closed',
            closing_date: new Date(),
            closed_by: userName || userId
        });
    },

    async getFiscalSettings(companyId) {
        return await FinancialPeriodModel.getFiscalSettings(companyId);
    },

    async saveFiscalSettings(companyId, month) {
        return await FinancialPeriodModel.upsertFiscalSettings(companyId, month);
    },

    // --- Integration Helpers ---
    async validateDate(companyId, dateStr) {
        return this.checkPeriodLock(companyId, dateStr, null);
    },

    async checkPeriodLock(companyId, dateStr, userRole) {
        if (!dateStr) throw new Error('Date is reserved for validation');
        const period = await FinancialPeriodModel.findOpenPeriodByDate(companyId, dateStr);

        if (!period) {
            // Check if it falls in a "Closing" period? (If we had such status)
            // For now, strict OPEN check.
            throw new Error(`Transaction date ${dateStr} does not fall within any OPEN Financial Period.`);
        }

        // Future expansion: 
        // if (period.status === 'Closing' && userRole !== 'Controller') throw ...
        return true;
    },
};

export default FinancialPeriodService;
