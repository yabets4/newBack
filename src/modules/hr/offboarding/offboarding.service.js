import { OffboardingModel } from './offboarding.model.js';

export default class OffboardingService {
  constructor() {
    this.model = OffboardingModel;
  }

  async listTemplates(companyId) { return await this.model.listTemplates(companyId); }
  async getTemplate(companyId, id) { return await this.model.getTemplate(companyId, id); }
  async createTemplate(companyId, data) { if (!data.template_id) data.template_id = `TPL-${Date.now()}`; return await this.model.createTemplate(companyId, data); }
  async updateTemplate(companyId, id, data) { return await this.model.updateTemplate(companyId, id, data); }
  async deleteTemplate(companyId, id) { return await this.model.deleteTemplate(companyId, id); }

  async listProcesses(companyId, opts = {}) { return await this.model.listProcesses(companyId, opts); }
  async getProcess(companyId, id) { return await this.model.getProcess(companyId, id); }
  async createProcess(companyId, data) { if (!data.process_id) data.process_id = `PROC-${Date.now()}`; return await this.model.createProcess(companyId, data); }
  async updateProcess(companyId, id, data) { return await this.model.updateProcess(companyId, id, data); }
  async deleteProcess(companyId, id) { return await this.model.deleteProcess(companyId, id); }
  async updateTaskStatus(companyId, processId, taskId, status) { return await this.model.updateTaskStatus(companyId, processId, taskId, status); }
}
