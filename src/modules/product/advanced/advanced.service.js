import { AdvancedModel } from './advanced.model.js';

export default class AdvancedService {
    // Nesting Jobs
    async listJobs(companyId) {
        return await AdvancedModel.findJobs(companyId);
    }

    async createJob(companyId, data) {
        return await AdvancedModel.createJob(companyId, data);
    }

    async updateJobStatus(companyId, jobId, status) {
        return await AdvancedModel.updateJobStatus(companyId, jobId, status);
    }

    // Nesting Layouts
    async listLayoutsByJob(companyId, jobId) {
        return await AdvancedModel.findLayoutsByJob(companyId, jobId);
    }

    async createLayout(companyId, data) {
        return await AdvancedModel.createLayout(companyId, data);
    }

    async updateLayoutStatus(companyId, layoutId, status) {
        return await AdvancedModel.updateLayoutStatus(companyId, layoutId, status);
    }

    // Offcuts
    async listOffcuts(companyId, filters) {
        return await AdvancedModel.findOffcuts(companyId, filters);
    }

    async createOffcut(companyId, data) {
        return await AdvancedModel.createOffcut(companyId, data);
    }

    async updateOffcut(companyId, offcutId, data) {
        return await AdvancedModel.updateOffcut(companyId, offcutId, data);
    }

    async deleteOffcut(companyId, offcutId) {
        return await AdvancedModel.deleteOffcut(companyId, offcutId);
    }

    async listNestingMaterials(companyId) {
        return await AdvancedModel.findNestingMaterials(companyId);
    }

    async listNestingParts(companyId) {
        return await AdvancedModel.findNestingParts(companyId);
    }
}
