import { CostingModel } from './costing.model.js';

export default class CostingService {
    async listRules(companyId, filters) {
        return await CostingModel.findRules(companyId, filters);
    }

    async getRule(companyId, ruleId) {
        const rule = await CostingModel.findRuleById(companyId, ruleId);
        if (!rule) throw new Error('Costing rule not found');
        return rule;
    }

    async createRule(companyId, data) {
        return await CostingModel.createRule(companyId, data);
    }

    async updateRule(companyId, ruleId, data) {
        const updated = await CostingModel.updateRule(companyId, ruleId, data);
        if (!updated) throw new Error('Costing rule not found or not updated');
        return updated;
    }

    async deleteRule(companyId, ruleId) {
        const deleted = await CostingModel.deleteRule(companyId, ruleId);
        if (!deleted) throw new Error('Costing rule not found or not deleted');
        return { success: true };
    }
}
