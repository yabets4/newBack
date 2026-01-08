import AdvancedService from './advanced.service.js';
import { ok, created, noContent } from '../../../utils/apiResponse.js';

const service = new AdvancedService();

export default class AdvancedController {
    // Nesting Jobs
    static async listJobs(req, res, next) {
        try {
            const jobs = await service.listJobs(req.auth.companyID);
            return ok(res, jobs);
        } catch (e) {
            next(e);
        }
    }

    static async createJob(req, res, next) {
        try {
            const job = await service.createJob(req.auth.companyID, req.body);
            return created(res, job);
        } catch (e) {
            next(e);
        }
    }

    static async updateJobStatus(req, res, next) {
        try {
            const job = await service.updateJobStatus(req.auth.companyID, req.params.jobId, req.body.status);
            return ok(res, job);
        } catch (e) {
            next(e);
        }
    }

    // Nesting Layouts
    static async listLayoutsByJob(req, res, next) {
        try {
            const layouts = await service.listLayoutsByJob(req.auth.companyID, req.params.jobId);
            return ok(res, layouts);
        } catch (e) {
            next(e);
        }
    }

    static async createLayout(req, res, next) {
        try {
            const layout = await service.createLayout(req.auth.companyID, req.body);
            return created(res, layout);
        } catch (e) {
            next(e);
        }
    }

    static async updateLayoutStatus(req, res, next) {
        try {
            const layout = await service.updateLayoutStatus(req.auth.companyID, req.params.layoutId, req.body.status);
            return ok(res, layout);
        } catch (e) {
            next(e);
        }
    }

    // Offcuts
    static async listOffcuts(req, res, next) {
        try {
            const filters = {
                materialId: req.query.materialId,
                status: req.query.status
            };
            const offcuts = await service.listOffcuts(req.auth.companyID, filters);
            return ok(res, offcuts);
        } catch (e) {
            next(e);
        }
    }

    static async createOffcut(req, res, next) {
        try {
            const offcut = await service.createOffcut(req.auth.companyID, req.body);
            return created(res, offcut);
        } catch (e) {
            next(e);
        }
    }

    static async updateOffcut(req, res, next) {
        try {
            const offcut = await service.updateOffcut(req.auth.companyID, req.params.offcutId, req.body);
            return ok(res, offcut);
        } catch (e) {
            next(e);
        }
    }

    static async deleteOffcut(req, res, next) {
        try {
            await service.deleteOffcut(req.auth.companyID, req.params.offcutId);
            return noContent(res);
        } catch (e) {
            next(e);
        }
    }

    static async listMaterials(req, res, next) {
        try {
            const materials = await service.listNestingMaterials(req.auth.companyID);
            return ok(res, materials);
        } catch (e) {
            next(e);
        }
    }

    static async listParts(req, res, next) {
        try {
            const parts = await service.listNestingParts(req.auth.companyID);
            return ok(res, parts);
        } catch (e) {
            next(e);
        }
    }
}
