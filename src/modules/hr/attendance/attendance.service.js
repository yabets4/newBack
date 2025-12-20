import { AttendanceModel } from './attendance.model.js';

export default class AttendanceService {
  async listAttendance(companyId, opts = {}) {
    try {
      return await AttendanceModel.findAll(companyId, opts);
    } catch (err) {
      console.error('AttendanceService.listAttendance error', err);
      throw new Error('Could not fetch attendance records');
    }
  }

  async getAttendance(companyId, attendanceId) {
    try {
      const rec = await AttendanceModel.findById(companyId, attendanceId);
      if (!rec) throw new Error('Attendance not found');
      return rec;
    } catch (err) {
      console.error('AttendanceService.getAttendance error', err);
      throw err;
    }
  }

  async createAttendance(companyId, data) {
    try {
      return await AttendanceModel.create(companyId, data);
    } catch (err) {
      console.error('AttendanceService.createAttendance error', err);
      throw new Error('Could not create attendance record');
    }
  }

  async bulkImport(companyId, records) {
    try {
      return await AttendanceModel.bulkInsert(companyId, records);
    } catch (err) {
      console.error('AttendanceService.bulkImport error', err);
      throw new Error('Could not import attendance records');
    }
  }

  async getByEmployeeRange(companyId, employeeId, startDate, endDate) {
    try {
      const opts = { employee_id: employeeId, start_date: startDate, end_date: endDate, limit: 10000 };
      return await AttendanceModel.findAll(companyId, opts);
    } catch (err) {
      console.error('AttendanceService.getByEmployeeRange error', err);
      throw new Error('Could not fetch attendance records');
    }
  }

  async updateAttendance(companyId, attendanceId, data) {
    try {
      const updated = await AttendanceModel.update(companyId, attendanceId, data);
      if (!updated) throw new Error('Attendance not found or update failed');
      return updated;
    } catch (err) {
      console.error('AttendanceService.updateAttendance error', err);
      throw err;
    }
  }

  async deleteAttendance(companyId, attendanceId) {
    try {
      const deleted = await AttendanceModel.remove(companyId, attendanceId);
      if (!deleted) throw new Error('Attendance not found or could not delete');
      return { success: true };
    } catch (err) {
      console.error('AttendanceService.deleteAttendance error', err);
      throw err;
    }
  }
}
