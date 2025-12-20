import ShiftModel from './shift.model.js';

export default class ShiftService {
  constructor() {
    this.model = new ShiftModel();
  }

  // List shifts for a company (opts may include employee_id, start_date, end_date, limit, offset)
  async listShifts(companyId, opts = {}) {
    return await this.model.findAll(companyId, opts);
  }

  async getShift(companyId, id) {
    return await this.model.findById(companyId, id);
  }

  async getShiftsByEmployee(companyId, employeeId) {
    return await this.model.findByEmployeeId(companyId, employeeId);
  }

  async createShift(companyId, data) {
    // Prevent overlapping shifts for the same employee on the same date
    const { employee_id, shift_date, start_time, end_time } = data;
    if (employee_id && shift_date) {
      const sameDay = await this.model.findAll(companyId, { employee_id, start_date: shift_date, end_date: shift_date, limit: 1000 });
      // normalize times to minutes for comparison
      const toMins = (t) => { if (!t) return null; const [hh,mm] = t.split(':').map(Number); return hh*60 + (mm||0); };
      const newStart = toMins(start_time);
      const newEnd = toMins(end_time);
      for (const s of sameDay) {
        const exStart = toMins(s.start_time);
        const exEnd = toMins(s.end_time);
        // If either record lacks a start/end, treat as overlapping (conservative)
        if (newStart === null || newEnd === null || exStart === null || exEnd === null) {
          throw { type: 'bad_request', message: 'Employee already has a shift during that time (incomplete time data).' };
        }
        if (newStart < exEnd && exStart < newEnd) {
          throw { type: 'bad_request', message: 'Employee already has a shift that overlaps the requested time.' };
        }
      }
    }
    return await this.model.create(companyId, data);
  }

  async updateShift(companyId, id, data) {
    // Ensure updates do not create overlapping shifts
    const existing = await this.model.findById(companyId, id);
    if (!existing) return null;
    const employee_id = data.employee_id || existing.employee_id;
    const shift_date = data.shift_date || existing.shift_date;
    const start_time = data.start_time || existing.start_time;
    const end_time = data.end_time || existing.end_time;

    if (employee_id && shift_date) {
      const sameDay = await this.model.findAll(companyId, { employee_id, start_date: shift_date, end_date: shift_date, limit: 1000 });
      const toMins = (t) => { if (!t) return null; const [hh,mm] = t.split(':').map(Number); return hh*60 + (mm||0); };
      const newStart = toMins(start_time);
      const newEnd = toMins(end_time);
      for (const s of sameDay) {
        // skip the current record
        if (s.shift_id === existing.shift_id || String(s.id) === String(existing.id)) continue;
        const exStart = toMins(s.start_time);
        const exEnd = toMins(s.end_time);
        if (newStart === null || newEnd === null || exStart === null || exEnd === null) {
          throw { type: 'bad_request', message: 'Employee already has a shift during that time (incomplete time data).' };
        }
        if (newStart < exEnd && exStart < newEnd) {
          throw { type: 'bad_request', message: 'Employee already has a shift that overlaps the requested time.' };
        }
      }
    }
    return await this.model.update(companyId, id, data);
  }

  async deleteShift(companyId, id) {
    return await this.model.delete(companyId, id);
  }
}
