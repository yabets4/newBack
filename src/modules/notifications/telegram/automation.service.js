import pool from '../../../loaders/db.loader.js';
import telegramService from './telegram.service.js';
import telegramModel from './telegram.model.js';

export const AutomationService = {
    /**
     * Check for low stock items and notify
     */
    async checkLowStock(companyId) {
        try {
            const q = `
                SELECT raw_material_id, name, current_stock, minimum_stock 
                FROM raw_materials 
                WHERE company_id = $1 AND current_stock < minimum_stock
            `;
            const { rows } = await pool.query(q, [companyId]);

            if (rows.length === 0) return;

            let message = "⚠️ <b>Low Stock Alert</b>\n\nThe following items are below minimum stock:\n";
            rows.forEach(item => {
                message += `\n• ${item.name} (${item.raw_material_id}): ${item.current_stock} (Min: ${item.minimum_stock})`;
            });

            await telegramService.sendToSubscriber(companyId, 'Owner', null, message);
        } catch (error) {
            console.error(`Error in checkLowStock for ${companyId}:`, error);
        }
    },

    /**
     * Check for critical finance conditions
     * (Placeholder for complex finance logic)
     */
    async checkCriticalFinance(companyId) {
        try {
            // e.g., Check current ratio
            const settings = await telegramModel.getAutomationRules(companyId);
            const financeRule = settings.find(r => r.rule_type === 'critical_finance');

            if (!financeRule) return;

            // Simple logic: If Net Income for last 30 days is negative
            // In a real app, this would query FinanceReportService
            const netIncomeQ = `
                SELECT SUM(CASE WHEN account_type = 'Revenue' THEN credit - debit ELSE debit - credit END) as net_income
                FROM ledger_entries le
                JOIN chart_of_accounts coa ON coa.account_id = le.account_id AND coa.company_id = le.company_id
                WHERE le.company_id = $1 AND le.posting_date >= NOW() - INTERVAL '30 days'
                AND coa.account_type IN ('Revenue', 'Expense')
            `;
            const { rows } = await pool.query(netIncomeQ, [companyId]);
            const netIncome = Number(rows[0]?.net_income || 0);

            if (netIncome < 0) {
                const message = `🚨 <b>Financial Alert</b>\n\nNet Income for the last 30 days is negative: <b>$${Math.abs(netIncome).toLocaleString()}</b>. Please review your expenses.`;
                await telegramService.sendToSubscriber(companyId, 'Owner', null, message);
            }
        } catch (error) {
            console.error(`Error in checkCriticalFinance for ${companyId}:`, error);
        }
    },

    
    async runAutomation(companyId) {
        const rules = await telegramModel.getAutomationRules(companyId);

        for (const rule of rules) {
            if (rule.rule_type === 'low_stock') {
                await this.checkLowStock(companyId);
            } else if (rule.rule_type === 'critical_finance') {
                await this.checkCriticalFinance(companyId);
            }
        }
    }
};

export default AutomationService;
