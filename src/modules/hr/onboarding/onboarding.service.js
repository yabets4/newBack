import { OnboardingModel } from './onboarding.model.js';
import { EmployeeModel } from '../employee/employee.model.js';

export default class OnboardingService {
  constructor() {
    this.model = OnboardingModel;
  }

  // Templates
  async listTemplates(companyId) {
    return await this.model.listTemplates(companyId);
  }

  async getTemplate(companyId, id) {
    return await this.model.getTemplate(companyId, id);
  }

  async createTemplate(companyId, data) {
    // ensure template_id exists
    if (!data.template_id) data.template_id = `TPL-${Date.now()}`;
    return await this.model.createTemplate(companyId, data);
  }

  async updateTemplate(companyId, id, data) {
    return await this.model.updateTemplate(companyId, id, data);
  }

  async deleteTemplate(companyId, id) {
    return await this.model.deleteTemplate(companyId, id);
  }

  // Processes
  async listProcesses(companyId, opts = {}) {
    return await this.model.listProcesses(companyId, opts);
  }

  async getProcess(companyId, id) {
    return await this.model.getProcess(companyId, id);
  }

  async createProcess(companyId, data) {
    if (!data.process_id) data.process_id = `PROC-${Date.now()}`;

    // Resolve employee name and department from employees table when possible
    let employee_name = null;
    let employee_department = null;
    try {
      if (data.employee_id) {
        const emp = await EmployeeModel.findById(companyId, data.employee_id);
        if (emp) {
          employee_name = emp.name || null;
          employee_department = emp.department || null;
        }
      }
    } catch (e) {
      // non-fatal; proceed without populated fields
      console.warn('Could not resolve employee details for onboarding process', e && e.message);
    }

    // Resolve template name
    let template_name = null;
    try {
      if (data.template_id) {
        const tpl = await this.getTemplate(companyId, data.template_id);
        if (tpl) template_name = tpl.name || null;
      }
    } catch (e) {
      console.warn('Could not resolve template for onboarding process', e && e.message);
    }

    const payload = { ...data, employee_name, employee_department, template_name };
    return await this.model.createProcess(companyId, payload);
  }

  async updateProcess(companyId, id, data) {
    // When updating, also attempt to refresh employee/template names
    let employee_name = data.employee_name || null;
    let employee_department = data.employee_department || null;
    if (data.employee_id) {
      try {
        const emp = await EmployeeModel.findById(companyId, data.employee_id);
        if (emp) {
          employee_name = emp.name || employee_name;
          employee_department = emp.department || employee_department;
        }
      } catch (e) { console.warn('Could not resolve employee on update', e && e.message); }
    }
    let template_name = data.template_name || null;
    if (data.template_id) {
      try {
        const tpl = await this.getTemplate(companyId, data.template_id);
        if (tpl) template_name = tpl.name || template_name;
      } catch (e) { console.warn('Could not resolve template on update', e && e.message); }
    }
    const payload = { ...data, employee_name, employee_department, template_name };
    return await this.model.updateProcess(companyId, id, payload);
  }

  async deleteProcess(companyId, id) {
    return await this.model.deleteProcess(companyId, id);
  }

  async updateTaskStatus(companyId, processId, taskId, status) {
    return await this.model.updateTaskStatus(companyId, processId, taskId, status);
  }
}
