import LeaveRequestModel from './leaveRequest.model.js';

export default class LeaveRequestService {
  constructor() {
    this.model = new LeaveRequestModel();
  }

  async getAllLeaveRequests(companyId, options) {
    return await this.model.findAll(companyId, options);
  }

  async getLeaveRequestById(companyId, id) {
    return await this.model.findById(companyId, id);
  }

  async getLeaveRequestsByEmployee(companyId, employeeId) {
    return await this.model.findByEmployeeId(companyId, employeeId);
  }

  async createLeaveRequest(companyId, data) {
    return await this.model.create(companyId, data);
  }

  async updateLeaveRequest(companyId, id, data) {
    return await this.model.update(companyId, id, data);
  }

  async deleteLeaveRequest(companyId, id) {
    return await this.model.delete(companyId, id);
  }

  async approveLeaveRequest(companyId, id, approver_comments) {
    return await this.model.approve(companyId, id, approver_comments);
  }

  async rejectLeaveRequest(companyId, id, approver_comments) {
    return await this.model.reject(companyId, id, approver_comments);
  }

}