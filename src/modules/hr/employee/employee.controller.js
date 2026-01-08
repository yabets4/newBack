import EmployeeService from './employee.service.js';
import { ok, notFound, created } from '../../../utils/apiResponse.js';
import { getCompanyNameById } from '../../../middleware/services/company.service.js';

const service = new EmployeeService();

// Convert an absolute filesystem path returned by multer to a public URL
// served by express.static at '/uploads'. Examples supported:
//  - C:\...\uploads\Company\file.png  -> /uploads/Company/file.png
//  - /home/.../uploads/Company/file.png   -> /uploads/Company/file.png
const toPublicUploadUrl = (filePath) => {
  if (!filePath) return null;
  try {
    // Normalize separators and split by 'uploads/' directory
    const normalized = String(filePath).replace(/\\/g, '/');
    const parts = normalized.split('/uploads/');
    if (parts.length > 1) return `/uploads/${parts.slice(1).join('/uploads/')}`;
    // If 'uploads' not found, return the raw path (caller can decide)
    return filePath;
  } catch (e) {
    return filePath;
  }
};

// Normalize attachments inside an employee record so any stored filesystem
// paths are converted to public URLs served under /uploads.
const normalizeEmployeeRecord = (rec) => {
  if (!rec || typeof rec !== 'object') return rec;
  const out = { ...rec };
  // main profile photo
  if (out.profile_photo_url) out.profile_photo_url = toPublicUploadUrl(out.profile_photo_url);
  // national id attachment on employee record
  if (out.national_id_attachment) out.national_id_attachment = toPublicUploadUrl(out.national_id_attachment);
  // emergency contacts
  if (Array.isArray(out.emergency_contacts)) {
    out.emergency_contacts = out.emergency_contacts.map(c => ({
      ...c,
      attachment: c?.attachment ? toPublicUploadUrl(c.attachment) : (c?.national_id_attachment ? toPublicUploadUrl(c.national_id_attachment) : null)
    }));
  }
  // certifications (from skills_certifications table)
  if (Array.isArray(out.certifications)) {
    out.certifications = out.certifications.map(c => ({ ...c, attachment: c?.attachment ? toPublicUploadUrl(c.attachment) : null }));
  }
  return out;
};

export default class EmployeeController {
  // GET /employees
  static async getAll(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      // Debug: log incoming request body/files to diagnose attachment issues
      try { console.debug('[EmployeeController.getAll] req.files:', req.files || null); } catch (e) { }
      try { console.debug('[EmployeeController.getAll] req.body keys:', req.body ? Object.keys(req.body) : null); } catch (e) { }

      const employees = await service.getAllEmployees(companyId);
      // Normalize attachment paths for each employee record so front-end receives public URLs
      const normalized = Array.isArray(employees) ? employees.map(normalizeEmployeeRecord) : employees;
      return ok(res, normalized);
    } catch (e) {
      console.error('Error creating employee', e);
      throw e;

      next(e);
    }
  }

  // GET /employees/:id
  static async getById(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      console.log(companyId);

      if (!companyId) return res.status(400).json({ success: false, message: 'Company ID is required' });
      let employee = await service.getEmployeeById(companyId, req.params.id);
      if (!employee) return notFound(res, 'Employee not found');
      employee = normalizeEmployeeRecord(employee);
      // Debug: show normalized employee attachments returned to client
      try {
        console.debug('[EmployeeController.getById] returning employee attachments:', {
          profile_photo_url: employee.profile_photo_url,
          national_id_attachment: employee.national_id_attachment,
          certifications: employee.certifications && employee.certifications.map(c => c.attachment),
          emergency_contacts: employee.emergency_contacts && employee.emergency_contacts.map(c => c.attachment || c.national_id_attachment)
        });
      } catch (e) { }
      return ok(res, employee);
    } catch (e) {
      next(e);
    }
  }

  // GET /employees/:id/leave-balances
  static async getLeaveBalances(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const balances = await service.getLeaveBalances(companyId, req.params.id);
      return ok(res, balances);
    } catch (e) {
      next(e);
    }
  }

  // PATCH /employees/:id/status
  static async setStatus(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const employeeId = req.params.id;
      const { status } = req.body;
      if (!status) return res.status(400).json({ success: false, message: 'Status is required' });
      const updated = await service.setEmployeeStatus(companyId, employeeId, status);
      if (!updated) return notFound(res, 'Employee not found');
      return ok(res, updated);
    } catch (e) {
      next(e);
    }
  }

  // POST /employees/:id/leave-balances
  static async setLeaveBalances(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      let data = req.body;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = []; }
      }
      const balances = Array.isArray(data) ? data : (data.balances || []);
      await service.setLeaveBalances(companyId, req.params.id, balances);
      return ok(res, { success: true });
    } catch (e) {
      next(e);
    }
  }

  // POST /employees
  static async create(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const data = { ...req.body };

      // Resolve company safe folder name so we can set public upload URLs like
      // `/uploads/<SafeCompanyName>/employees/<filename>` (matches rawMaterial.controller)
      let companyName;
      try { companyName = await getCompanyNameById(companyId); } catch (e) { companyName = null; }
      const safeName = (companyName || 'default').replace(/[^a-zA-Z0-9-_]/g, '_');

      // parse JSON fields early so we can attach file paths into arrays/objects
      try {
        if (typeof data.emergency_contacts === 'string') data.emergency_contacts = JSON.parse(data.emergency_contacts);
      } catch (e) { data.emergency_contacts = [] }
      try {
        if (typeof data.certifications === 'string') data.certifications = JSON.parse(data.certifications);
      } catch (e) { data.certifications = [] }
      try {
        if (typeof data.skills === 'string') data.skills = JSON.parse(data.skills);
      } catch (e) { data.skills = [] }
      try {
        if (typeof data.payroll === 'string') data.payroll = JSON.parse(data.payroll);
      } catch (e) { data.payroll = data.payroll || {} }
      try {
        if (typeof data.part_time_schedule === 'string') data.part_time_schedule = JSON.parse(data.part_time_schedule);
      } catch (e) { /* leave as-is */ }

      // handle file uploads (multer.any() returns an array of files)
      if (req.files) {
        // multer.any() populates req.files as an array; multer.fields() uses an object
        if (Array.isArray(req.files)) {
          // Try to map patterned fieldnames into parsed JSON structures
          for (const f of req.files) {
            const name = f.fieldname;
            if (name === 'profile_photo_attachment') {
              data.profile_photo_url = `/uploads/${safeName}/employees/${f.filename}`;
              continue;
            }
            if (name === 'national_id_attachment') {
              data.national_id_attachment = `/uploads/${safeName}/employees/${f.filename}`;
              continue;
            }

            // emergency_contacts[<i>][attachment]
            const em = name.match(/^emergency_contacts\[(\d+)\]\[(?:attachment|national_id_attachment)\]$/);
            if (em) {
              const idx = parseInt(em[1], 10);
              data.emergency_contacts = data.emergency_contacts || [];
              data.emergency_contacts[idx] = data.emergency_contacts[idx] || {};
              data.emergency_contacts[idx].attachment = `/uploads/${safeName}/employees/${f.filename}`;
              continue;
            }

            // certifications[<i>][attachment] or skills_certifications[...] pattern
            const cert = name.match(/^(?:certifications|skills_certifications)\[(\d+)\]\[(?:attachment)\]$/);
            if (cert) {
              const idx = parseInt(cert[1], 10);
              // Prefer the combined skills_certifications payload if present
              let sc = data.skills_certifications;
              if (typeof sc === 'string') {
                try { sc = JSON.parse(sc); } catch (e) { sc = []; }
              }
              sc = sc || [];
              sc[idx] = sc[idx] || {};
              sc[idx].attachment = `/uploads/${safeName}/employees/${f.filename}`;
              data.skills_certifications = sc;
              continue;
            }
          }
        } else {
          // multer.fields() -> req.files is an object with arrays
          if (req.files.profile_photo_attachment?.[0]) data.profile_photo_url = `/uploads/${safeName}/employees/${req.files.profile_photo_attachment[0].filename}`;
          if (req.files.national_id_attachment?.[0]) data.national_id_attachment = `/uploads/${safeName}/employees/${req.files.national_id_attachment[0].filename}`;
        }
      }

      // Debug: show the data object being saved (important: avoid logging huge binary buffers)
      try { console.debug('[EmployeeController.create] saving employee data keys:', Object.keys(data)); } catch (e) { }
      try {
        console.debug('[EmployeeController.create] sample attachment fields:', {
          profile_photo_url: data.profile_photo_url,
          national_id_attachment: data.national_id_attachment,
          certifications: data.skills_certifications || data.certifications,
          emergency_contacts: data.emergency_contacts
        });
      } catch (e) { }

      const newEmployee = await service.createEmployee(companyId, data);
      // Debug: newly created employee id / attachments
      try { console.debug('[EmployeeController.create] created employee id:', newEmployee && newEmployee.id); } catch (e) { }
      try {
        console.debug('[EmployeeController.create] created attachments:', {
          profile_photo_url: newEmployee && newEmployee.profile_photo_url,
          national_id_attachment: newEmployee && newEmployee.national_id_attachment
        });
      } catch (e) { }
      return created(res, newEmployee);
    } catch (e) {
      next(e);
    }
  }

  // PUT /employees/:id
  static async update(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const data = { ...req.body };

      // Resolve safe company name for consistent public upload URLs
      let companyName;
      try { companyName = await getCompanyNameById(companyId); } catch (e) { companyName = null; }
      const safeName = (companyName || 'default').replace(/[^a-zA-Z0-9-_]/g, '_');

      // parse JSON fields early so we can attach file paths into arrays/objects
      try {
        if (typeof data.emergency_contacts === 'string') data.emergency_contacts = JSON.parse(data.emergency_contacts);
      } catch (e) { data.emergency_contacts = [] }
      try {
        if (typeof data.certifications === 'string') data.certifications = JSON.parse(data.certifications);
      } catch (e) { data.certifications = [] }
      try {
        if (typeof data.skills === 'string') data.skills = JSON.parse(data.skills);
      } catch (e) { data.skills = [] }
      try {
        if (typeof data.payroll === 'string') data.payroll = JSON.parse(data.payroll);
      } catch (e) { data.payroll = data.payroll || {} }
      try {
        if (typeof data.part_time_schedule === 'string') data.part_time_schedule = JSON.parse(data.part_time_schedule);
      } catch (e) { /* leave as-is */ }

      // handle file uploads (multer.any() returns an array of files)
      if (req.files) {
        if (Array.isArray(req.files)) {
          for (const f of req.files) {
            const name = f.fieldname;
            if (name === 'profile_photo_attachment') {
              data.profile_photo_url = `/uploads/${safeName}/employees/${f.filename}`;
              continue;
            }
            if (name === 'national_id_attachment') {
              data.national_id_attachment = `/uploads/${safeName}/employees/${f.filename}`;
              continue;
            }

            const em = name.match(/^emergency_contacts\[(\d+)\]\[(?:attachment|national_id_attachment)\]$/);
            if (em) {
              const idx = parseInt(em[1], 10);
              data.emergency_contacts = data.emergency_contacts || [];
              data.emergency_contacts[idx] = data.emergency_contacts[idx] || {};
              data.emergency_contacts[idx].attachment = `/uploads/${safeName}/employees/${f.filename}`;
              continue;
            }

            const cert = name.match(/^(?:certifications|skills_certifications)\[(\d+)\]\[(?:attachment)\]$/);
            if (cert) {
              const idx = parseInt(cert[1], 10);
              let sc = data.skills_certifications;
              if (typeof sc === 'string') {
                try { sc = JSON.parse(sc); } catch (e) { sc = []; }
              }
              sc = sc || [];
              sc[idx] = sc[idx] || {};
              sc[idx].attachment = `/uploads/${safeName}/employees/${f.filename}`;
              data.skills_certifications = sc;
              continue;
            }
          }
        } else {
          if (req.files.profile_photo_attachment?.[0]) data.profile_photo_url = `/uploads/${safeName}/employees/${req.files.profile_photo_attachment[0].filename}`;
          if (req.files.national_id_attachment?.[0]) data.national_id_attachment = `/uploads/${safeName}/employees/${req.files.national_id_attachment[0].filename}`;
        }
      }

      // Debug: show the data object about to be used for update
      try { console.debug('[EmployeeController.update] updating employee id:', req.params.id, 'with keys:', Object.keys(data)); } catch (e) { }
      try {
        console.debug('[EmployeeController.update] sample attachment fields:', {
          profile_photo_url: data.profile_photo_url,
          national_id_attachment: data.national_id_attachment,
          certifications: data.skills_certifications || data.certifications,
          emergency_contacts: data.emergency_contacts
        });
      } catch (e) { }

      const employee = await service.updateEmployee(companyId, req.params.id, data);
      if (!employee) return notFound(res, 'Employee not found');
      // Debug: show updated record attachments returned by service
      try {
        console.debug('[EmployeeController.update] updated attachments:', {
          profile_photo_url: employee && employee.profile_photo_url,
          national_id_attachment: employee && employee.national_id_attachment,
          certifications: employee && employee.certifications && employee.certifications.map(c => c.attachment),
        });
      } catch (e) { }
      return ok(res, employee);
    } catch (e) {
      next(e);
    }
  }

  // DELETE /employees/:id
  static async delete(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const success = await service.deleteEmployee(companyId, req.params.id);
      if (!success) return notFound(res, 'Employee not found');
      return ok(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  static async getInfo(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const info = await service.getInfo(companyId);
      return ok(res, info);
    } catch (e) {
      next(e);
    }
  }

  // POST /employees/:id/promote
  static async promote(req, res, next) {
    try {
      const companyId = req.auth.companyID;
      const employeeId = req.params.id;
      const result = await service.promoteEmployee(companyId, employeeId);
      return ok(res, result);
    } catch (e) {
      // If specific business logic error (like no next level), return 400
      if (e.message && (e.message.includes('No further promotion') || e.message.includes('assign a level'))) {
        return res.status(400).json({ success: false, message: e.message });
      }
      next(e);
    }
  }
}
