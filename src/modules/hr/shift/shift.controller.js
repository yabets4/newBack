import ShiftService from './shift.service.js';
import { ok, notFound, created } from '../../../utils/apiResponse.js';

const service = new ShiftService();

export default class ShiftController {
  // GET /shift
  static async list(req, res, next) {
    try {
      const companyId = req.auth && req.auth.companyID;
      const opts = {
        employee_id: req.query.employee_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined
      };
      const rows = await service.listShifts(companyId, opts);
      return ok(res, rows);
    } catch (e) {
      next(e);
    }
  }

  // GET /shift/:id
  static async get(req, res, next) {
    try {
      const companyId = req.auth && req.auth.companyID;
      const rec = await service.getShift(companyId, req.params.id);
      if (!rec) return notFound(res, 'Shift not found');
      return ok(res, rec);
    } catch (e) {
      next(e);
    }
  }

  // GET /shift/employee/:employeeId
  static async getByEmployee(req, res, next) {
    try {
      const companyId = req.auth && req.auth.companyID;
      const rows = await service.getShiftsByEmployee(companyId, req.params.employeeId);
      return ok(res, rows);
    } catch (e) {
      next(e);
    }
  }

  // POST /shift
  static async create(req, res, next) {
    try {
      const companyId = req.auth && req.auth.companyID;
      const data = { ...req.body };
      try {
        const createdRec = await service.createShift(companyId, data);
        return created(res, createdRec);
      } catch (e) {
        if (e && e.type === 'bad_request') return badRequest(res, e.message);
        throw e;
      }
    } catch (e) {
      next(e);
    }
  }

  // PUT /shift/:id
  static async update(req, res, next) {
    try {
      const companyId = req.auth && req.auth.companyID;
      try {
        const updated = await service.updateShift(companyId, req.params.id, req.body);
        if (!updated) return notFound(res, 'Shift not found');
        return ok(res, updated);
      } catch (e) {
        if (e && e.type === 'bad_request') return badRequest(res, e.message);
        throw e;
      }
    } catch (e) {
      next(e);
    }
  }

  // DELETE /shift/:id
  static async delete(req, res, next) {
    try {
      const companyId = req.auth && req.auth.companyID;
      const result = await service.deleteShift(companyId, req.params.id);
      return ok(res, result);
    } catch (e) {
      next(e);
    }
  }
}
