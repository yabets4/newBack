import AttendanceService from './attendance.service.js';
import { ok, notFound, created } from '../../../utils/apiResponse.js';

const service = new AttendanceService();

export default class AttendanceController {
  // GET /attendance
  static async list(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const opts = {
        employee_id: req.query.employee_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined
      };
      const rows = await service.listAttendance(companyId, opts);
      return ok(res, rows);
    } catch (e) {
      next(e);
    }
  }

  // GET /attendance/:id
  static async get(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const rec = await service.getAttendance(companyId, req.params.id);
      if (!rec) return notFound(res, 'Attendance record not found');
      return ok(res, rec);
    } catch (e) {
      next(e);
    }
  }

  // POST /attendance
  static async create(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const data = { ...req.body };
      // Accept JSON fields if sent as strings
      if (typeof data.total_hours === 'string') data.total_hours = parseFloat(data.total_hours);

      const createdRec = await service.createAttendance(companyId, data);
      return created(res, createdRec);
    } catch (e) {
      next(e);
    }
  }

  // POST /attendance/import (CSV)
  static async importCsv(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      // file path from multer
      const filePath = req.file?.path || (req.files && req.files[0] && req.files[0].path);
      if (!filePath) return notFound(res, 'No file uploaded');

      // read file
      const fs = await import('fs');
      const content = fs.readFileSync(filePath, 'utf8');

      // simple CSV parse: first row headers
      const lines = content.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return ok(res, { inserted: 0, message: 'No data rows found' });

      const headers = lines[0].split(',').map(h => h.trim());
      const required = ['employee_id','event_date'];
      for (const r of required) if (!headers.includes(r)) return notFound(res, `Missing required column: ${r}`);

      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length === 0) continue;
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = parts[j] ? parts[j].trim() : null;
        }
        // normalize
        if (obj.total_hours) obj.total_hours = parseFloat(obj.total_hours);
        records.push(obj);
      }

      const result = await service.bulkImport(companyId, records);
      return ok(res, result);
    } catch (e) {
      next(e);
    }
  }

  // GET /attendance/employee/:id?start_date=yyyy-mm-dd&end_date=yyyy-mm-dd
  static async getByEmployeeRange(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const employeeId = req.params.id;
      const startDate = req.query.start_date;
      const endDate = req.query.end_date;
      const rows = await service.getByEmployeeRange(companyId, employeeId, startDate, endDate);
      return ok(res, rows);
    } catch (e) {
      next(e);
    }
  }

  // PUT /attendance/:id
  static async update(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const data = { ...req.body };
      if (typeof data.total_hours === 'string') data.total_hours = parseFloat(data.total_hours);
      const updated = await service.updateAttendance(companyId, req.params.id, data);
      if (!updated) return notFound(res, 'Attendance record not found');
      return ok(res, updated);
    } catch (e) {
      next(e);
    }
  }

  // DELETE /attendance/:id
  static async delete(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const result = await service.deleteAttendance(companyId, req.params.id);
      return ok(res, result);
    } catch (e) {
      next(e);
    }
  }
}
