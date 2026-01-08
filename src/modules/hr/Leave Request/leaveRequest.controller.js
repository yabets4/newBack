import LeaveRequestService from './leaveRequest.service.js';
import { ok, created, notFound, noContent } from '../../../utils/apiResponse.js';

const service = new LeaveRequestService();

export default class LeaveRequestController {
  static async getAll(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const opts = {
        employee_id: req.query.employee_id,
        status: req.query.status,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined
      };
      const requests = await service.getAllLeaveRequests(companyId, opts);
      return ok(res, requests);
    } catch (e) {
      next(e);
    }
  }

  static async getById(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const request = await service.getLeaveRequestById(companyId, req.params.id);
      if (!request) return notFound(res, 'Leave request not found');
      return ok(res, request);
    } catch (e) {
      next(e);
    }
  }

  static async getByEmployee(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const requests = await service.getLeaveRequestsByEmployee(companyId, req.params.employeeId);
      return ok(res, requests);
    } catch (e) {
      next(e);
    }
  }

  static async create(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const payload = { ...req.body };
      const request = await service.createLeaveRequest(companyId, payload);
      return created(res, request);
    } catch (e) {
      next(e);
    }
  }

  static async update(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const request = await service.updateLeaveRequest(companyId, req.params.id, req.body);
      if (!request) return notFound(res, 'Leave request not found');
      return ok(res, request);
    } catch (e) {
      next(e);
    }
  }

  static async delete(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const request = await service.deleteLeaveRequest(companyId, req.params.id);
      if (!request) return notFound(res, 'Leave request not found');
      return noContent(res);
    } catch (e) {
      next(e);
    }
  }
  static async approve(req, res, next) {
  try {
    const companyId = req.auth.companyID;
    const request = await service.approveLeaveRequest(companyId, req.params.id, req.body.approver_comments);
    if (!request) return notFound(res, 'Leave request not found');
    return ok(res, request);
  } catch (e) {
    next(e);
  }
}

    static async reject(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const request = await service.rejectLeaveRequest(companyId, req.params.id, req.body.approver_comments);
        if (!request) return notFound(res, 'Leave request not found');
        return ok(res, request);
    } catch (e) {
        next(e);
    }
    }

}
