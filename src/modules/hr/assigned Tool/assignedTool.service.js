import AssignedToolModel from './assignedTool.model.js';

export default class AssignedToolService {
  constructor() {
    this.model = new AssignedToolModel();
  }

  async getAllTools(prefix, options) {
    return await this.model.findAll(prefix, options);
  }

  async getToolById(prefix, id) {
    return await this.model.findById(prefix, id);
  }

  async createTool(prefix, data) {
    return await this.model.create(prefix, data);
  }

  async updateTool(prefix, id, data) {
    return await this.model.update(prefix, id, data);
  }

  async deleteTool(prefix, id) {
    return await this.model.delete(prefix, id);
  }
}
