import CostingService from './costing.service.js';
import { ok, created, noContent, notFound } from '../../../utils/apiResponse.js';

const service = new CostingService();

export default class CostingController {
    static async listRules(req, res, next) {
        try {
            const companyId = req.auth.companyID;
            const filters = {
                type: req.query.type,
                status: req.query.status
            };
            const rules = await service.listRules(companyId, filters);
            return ok(res, rules);
        } catch (e) {
            next(e);
        }
    }

    static async getRule(req, res, next) {
        try {
            const companyId = req.auth.companyID;
            const rule = await service.getRule(companyId, req.params.id);
            return ok(res, rule);
        } catch (e) {
            next(e);
        }
    }

    static async createRule(req, res, next) {
        try {
            const companyId = req.auth.companyID;
            const rule = await service.createRule(companyId, req.body);
            return created(res, rule);
        } catch (e) {
            next(e);
        }
    }

    static async updateRule(req, res, next) {
        try {
            const companyId = req.auth.companyID;
            const rule = await service.updateRule(companyId, req.params.id, req.body);
            return ok(res, rule);
        } catch (e) {
            next(e);
        }
    }

    static async deleteRule(req, res, next) {
        try {
            const companyId = req.auth.companyID;
            await service.deleteRule(companyId, req.params.id);
            return noContent(res);
        } catch (e) {
            next(e);
        }
    }
}
