import pool from "../../../loaders/db.loader.js";
import { DepartmentModel } from "../departments/department.model.js"
import LocationsModel from "../../crm/locations/locations.model.js"
import UserModel from "../users/user.model.js";


export const EmployeeModel = {
  async create(companyId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log('Employee insert data:', data);


      // 1. Generate employee_id
      const { rows: companyRows } = await client.query(
        `UPDATE companies 
         SET next_employee_number = COALESCE(next_employee_number, 0) + 1 
         WHERE company_id = $1 RETURNING next_employee_number`,
        [companyId]
      );
      const employeeNumber = companyRows[0].next_employee_number;
      const employee_id = `EMP-${String(employeeNumber).padStart(3, '0')}`;

      // 2. Insert into employees (static identity info)
      await client.query(
        `INSERT INTO employees (
          company_id, employee_id, name, email, phone_number,
          profile_photo_url, date_of_birth, gender,
          nationality, marital_status, national_id_number, national_id_attachment
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          companyId,
          employee_id,
          data.full_name,
          data.email,
          data.phone_number,
          data.profile_photo_url || null,
          data.date_of_birth || null,
          data.gender || null,
          data.nationality || null,
          data.marital_status || null,
          data.national_id_number || null,
          data.national_id_attachment || null
        ]
      );

      // 3. Insert into employee_employment_details (versioned)
      // Normalize employee_type coming from frontend (e.g. 'Part-time' -> 'part_time')
      const normalizeType = (v) => {
        if (!v && v !== '') return null;
        return String(v).toLowerCase().replace(/[-\s]/g, '_');
      };
      const employeeTypeNormalized = normalizeType(data.employee_type);

      const { rows: detailRows } = await client.query(
        `INSERT INTO employee_employment_details (
          company_id, employee_id, work_location, department, job_title,
          hire_date, employee_type, base_salary, pay_frequency,
          bank_name, bank_account_number, department_id, job_id, job_level_id, job_level_name
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [
          companyId,
          employee_id,
          data.work_location || null,
          data.department || null,
          data.job_title || null,
          data.hire_date || null,
          employeeTypeNormalized, // normalized
          data.base_salary || null,
          data.pay_frequency || null,
          data.bank_name || null,
          data.bank_account_number || null,
          data.department_id || null,
          data.job_id || null,
          data.job_level_id || null,
          data.job_level_name || null
        ]
      );
      const employmentDetailId = detailRows[0].id;

      // 4. Insert into type-specific table
      if (data.employee_type === 'full_time') {
        await client.query(
          `INSERT INTO employee_full_time_details (employment_detail_id, contract_type, reports_to, deputy_manager)
           VALUES ($1,$2,$3,$4)`,
          [employmentDetailId, data.contract_type || null, data.reports_to || null, data.deputy_manager || null]
        );
      }

      if (data.employee_type === 'contractor') {
        await client.query(
          `INSERT INTO employee_contractor_details (employment_detail_id, start_date, end_date, reports_to, deputy_manager)
           VALUES ($1,$2,$3,$4,$5)`,
          [employmentDetailId, data.start_date || null, data.end_date || null, data.reports_to || null, data.deputy_manager || null]
        );
      }

      if (employeeTypeNormalized === 'part_time') {
        // part time details
        // Normalize interval (frontend may send 'bi-monthly') -> DB expects 'bi_monthly'
        const normalizeInterval = (v) => v ? String(v).toLowerCase().replace(/[-\s]/g, '_') : null;
        const intervalNormalized = normalizeInterval(data.part_time_interval || data.part_time_interval === '' ? data.part_time_interval : null);
        const { rows: ptRows } = await client.query(
          `INSERT INTO employee_part_time_details (employment_detail_id, part_time_interval)
           VALUES ($1,$2) RETURNING id`,
          [employmentDetailId, intervalNormalized]
        );

        // schedule rows
        // data.part_time_schedule may come as JSON string (FormData) or as array
        let scheduleRows = data.part_time_schedule;
        if (typeof scheduleRows === 'string') {
          try { scheduleRows = JSON.parse(scheduleRows); } catch (e) { scheduleRows = []; }
        }
        if (Array.isArray(scheduleRows)) {
          const normalizeDay = (d) => {
            if (!d && d !== '') return null;
            const s = String(d).trim();
            return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
          };
          for (const s of scheduleRows) {
            const weekNumber = s.week_number || s.weekNumber || 1;
            const day = normalizeDay(s.day_of_week || s.dayOfWeek || s.day || '');
            const start = s.start || s.start_time || s.startTime || null;
            const end = s.end || s.end_time || s.endTime || null;
            await client.query(
              `INSERT INTO employee_part_time_schedule (employment_detail_id, week_number, day_of_week, start_time, end_time)
               VALUES ($1,$2,$3,$4,$5)`,
              [employmentDetailId, weekNumber, day || null, start || null, end || null]
            );
          }
        }
      }

      // 5. Emergency contacts
      if (Array.isArray(data.emergency_contacts)) {
        for (const c of data.emergency_contacts) {
          await client.query(
            `INSERT INTO employee_emergency_contacts 
              (company_id, employee_id, contact_name, relationship, phone, national_id_number, national_id_attachment)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [companyId, employee_id, c.contact_name, c.relationship, c.phone, c.national_id_number || null, c.national_id_attachment || null]
          );
        }
      }

      // 6. Skills & Certifications
      let skillsCerts = data.skills_certifications;
      if (typeof skillsCerts === 'string') {
        try {
          skillsCerts = JSON.parse(skillsCerts);
        } catch (e) {
          skillsCerts = [];
        }
      }
      if (Array.isArray(skillsCerts)) {
        for (const sc of skillsCerts) {
          await client.query(
            `INSERT INTO employee_skills_certifications 
              (company_id, employee_id, skill_name, certification_name, issued_by, expiry_date, attachment)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [companyId, employee_id, sc.skill_name || null, sc.certification_name || null, sc.issued_by || null, sc.expiry_date || null, sc.attachment || null]
          );
        }
      }

      // 7. Create user account if requested
      if (data.create_user_account === true || data.create_user_account === 'true') {
        try {
          await UserModel.create(companyId, {
            name: data.full_name,
            email: data.email,
            phone: data.phone_number,
            password: '0000',
            role: 'staff'
          });
        } catch (e) {
          console.error('Failed to provision user during employee creation:', e);
          throw new Error('Employee created but failed to provision user account.');
        }
      }

      await client.query('COMMIT');


      return { employee_id, employment_detail_id: employmentDetailId };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating employee', err);
      throw err;
    } finally {
      client.release();
    }
  },

  async findAll(companyId) {
    const { rows } = await pool.query(
      `SELECT e.*, 
              eed.department, 
              eed.job_title, 
              eed.job_level_id, 
              eed.job_level_name 
       FROM employees e
       LEFT JOIN LATERAL (
         SELECT department, job_title, job_level_id, job_level_name
         FROM employee_employment_details
         WHERE employee_id = e.employee_id AND company_id = e.company_id
         ORDER BY created_at DESC
         LIMIT 1
       ) eed ON true
       WHERE e.company_id = $1 
       ORDER BY e.created_at DESC`,
      [companyId]
    );
    return rows;
  },

  // ✅ GET ONE EMPLOYEE (with related details)
  async findById(companyId, employeeId) {

    // 1. Base employee
    const { rows: empRows } = await pool.query(
      `SELECT * FROM employees WHERE company_id = $1 AND employee_id = $2`,
      [companyId, employeeId]
    );
    if (empRows.length === 0) return null;
    const employee = empRows[0];

    // Check if a user account already exists for this employee's email
    if (employee.email) {
      const { rows: userRows } = await pool.query(
        `SELECT u.user_id FROM users u 
         JOIN user_profiles p ON p.company_id = u.company_id AND p.user_id = u.user_id
         WHERE u.company_id = $1 AND p.email = $2 LIMIT 1`,
        [companyId, employee.email]
      );
      employee.has_user_account = userRows.length > 0;
    } else {
      employee.has_user_account = false;
    }

    // 2. Emergency contacts
    const { rows: contacts } = await pool.query(
      `SELECT * FROM employee_emergency_contacts WHERE company_id = $1 AND employee_id = $2`,
      [companyId, employeeId]
    );
    employee.emergency_contacts = contacts;

    // 3. Skills & Certifications
    const { rows: skillsCerts } = await pool.query(
      `SELECT skill_name, certification_name, issued_by, expiry_date, attachment
     FROM employee_skills_certifications
     WHERE company_id = $1 AND employee_id = $2`,
      [companyId, employeeId]
    );
    employee.skills = skillsCerts.filter(sc => sc.skill_name).map(sc => sc.skill_name);
    employee.certifications = skillsCerts.filter(sc => sc.certification_name);

    // 4. Employment details — pull all fields from employee_employment_details
    const { rows: employmentRows } = await pool.query(
      `SELECT work_location, department, job_title, hire_date, employee_type, contract_type, reports_to, deputy_manager,
            base_salary, pay_frequency, bank_name, bank_account_number,
            department_id, job_id, job_level_id, job_level_name
     FROM employee_employment_details
     WHERE company_id = $1 AND employee_id = $2
     ORDER BY created_at DESC LIMIT 1`,
      [companyId, employeeId]
    );
    if (employmentRows[0]) {
      const empDetails = employmentRows[0];
      employee.work_location = empDetails.work_location;
      employee.department = empDetails.department;
      employee.job_title = empDetails.job_title;
      employee.hire_date = empDetails.hire_date;
      employee.employee_type = empDetails.employee_type;
      employee.contract_type = empDetails.contract_type;
      employee.reports_to = empDetails.reports_to;
      employee.reports_to = empDetails.reports_to;
      employee.deputy_manager = empDetails.deputy_manager;
      employee.department_id = empDetails.department_id;
      employee.job_id = empDetails.job_id;
      employee.job_level_id = empDetails.job_level_id;
      employee.job_level_name = empDetails.job_level_name;
      employee.payroll = {
        base_salary: empDetails.base_salary,
        pay_frequency: empDetails.pay_frequency,
        bank_name: empDetails.bank_name,
        bank_account: empDetails.bank_account_number
      };
    } else {
      employee.payroll = {};
    }
    // 6. Part-time interval (if part-time)
    if (employee.employee_type && employee.employee_type.toLowerCase() === 'part_time') {
      // Get part_time_interval from employee_part_time_details
      const { rows: intervalRows } = await pool.query(
        `SELECT part_time_interval FROM employee_part_time_details
       WHERE employment_detail_id = (
         SELECT id FROM employee_employment_details
         WHERE company_id = $1 AND employee_id = $2
         ORDER BY created_at DESC LIMIT 1
       ) LIMIT 1`,
        [companyId, employeeId]
      );
      if (intervalRows[0] && intervalRows[0].part_time_interval) {
        employee.part_time_interval = intervalRows[0].part_time_interval;
      }
      // Now fetch the schedule rows for the latest employment_detail
      const { rows: scheduleRows } = await pool.query(
        `SELECT week_number, day_of_week, start_time, end_time
       FROM employee_part_time_schedule
       WHERE employment_detail_id = (
         SELECT id FROM employee_employment_details
         WHERE company_id = $1 AND employee_id = $2
         ORDER BY created_at DESC LIMIT 1
       )`,
        [companyId, employeeId]
      );
      employee.part_time_schedule = scheduleRows;
    }
    // Fetch leave balances if available
    try {
      const { rows: leaveRows } = await pool.query(
        `SELECT id, leave_type, leave_type_key, total_days, remaining_days FROM employee_leave_balances
       WHERE company_id = $1 AND employee_id = $2 ORDER BY leave_type_key`,
        [companyId, employeeId]
      );
      employee.leaveBalances = leaveRows;
    } catch (e) {
      employee.leaveBalances = [];
    }

    return employee;
  }
  ,
  //contract_type
  // ✅ GET/UPSERT Leave Balances for an employee
  async getLeaveBalances(companyId, employeeId) {
    const { rows } = await pool.query(
      `SELECT id, leave_type, leave_type_key, total_days, remaining_days, created_at, updated_at
       FROM employee_leave_balances
       WHERE company_id = $1 AND employee_id = $2
       ORDER BY leave_type_key`,
      [companyId, employeeId]
    );
    return rows;
  },

  async upsertLeaveBalances(companyId, employeeId, balances = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const b of balances) {
        const leaveType = b.leave_type || b.type || null;
        const leaveKey = (b.leave_type_key || b.type_key || b.type || '') && String(b.leave_type_key || b.type_key || b.type || '').toLowerCase().replace(/\s+/g, '_');
        const total = Number.isFinite(Number(b.total_days)) ? Number(b.total_days) : (b.total_days ? parseInt(b.total_days, 10) : 0);
        const remaining = Number.isFinite(Number(b.remaining_days)) ? Number(b.remaining_days) : (b.remaining_days ? parseInt(b.remaining_days, 10) : 0);

        // Try update first
        const { rowCount } = await client.query(
          `UPDATE employee_leave_balances SET leave_type = $1, leave_type_key = $2, total_days = $3, remaining_days = $4, updated_at = NOW()
           WHERE company_id = $5 AND employee_id = $6 AND leave_type_key = $2`,
          [leaveType, leaveKey, total, remaining, companyId, employeeId]
        );

        if (rowCount === 0) {
          await client.query(
            `INSERT INTO employee_leave_balances (company_id, employee_id, leave_type, leave_type_key, total_days, remaining_days)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [companyId, employeeId, leaveType, leaveKey, total, remaining]
          );
        }
      }
      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },


  // ✅ UPDATE AN EMPLOYEE (static + related tables)
  async update(companyId, employeeId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update main employee fields
      const updateQuery = `
        UPDATE employees SET
          name = $3,
          email = $4,
          phone_number = $5,
          address = $6,
          date_of_birth = $7,
          gender = $8,
          nationality = $9,
          marital_status = $10,
          national_id_number = $11,
          national_id_attachment = $12,
          profile_photo_url = $13,
          status = $14,
          updated_at = NOW()
        WHERE company_id = $1 AND employee_id = $2
        RETURNING *;
      `;
      const updateValues = [
        companyId,
        employeeId,
        data.full_name,
        data.email,
        data.phone_number,
        data.address,
        data.date_of_birth,
        data.gender,
        data.nationality,
        data.marital_status,
        data.national_id || data.national_id_number || null,
        data.national_id_attachment || null,
        data.profile_photo_url || null,
        data.status || 'active'
      ];
      const { rows } = await client.query(updateQuery, updateValues);
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      // Update employment details (latest row)
      const updateEmploymentQuery = `
        UPDATE employee_employment_details SET
          work_location = $3,
          department = $4,
          job_title = $5,
          hire_date = $6,
          employee_type = $7,
          base_salary = $8,
          pay_frequency = $9,
          bank_name = $10,
          bank_account_number = $11,
          contract_type = $12,
          reports_to = $13,
          deputy_manager = $14,
          department_id = $15,
          job_id = $16,
          job_level_id = $17,
          job_level_name = $18,
          updated_at = NOW()
        WHERE company_id = $1 AND employee_id = $2
        RETURNING id;
      `;
      const updateEmploymentValues = [
        companyId,
        employeeId,
        data.work_location || null,
        data.department || null,
        data.job_title || null,
        data.hire_date || null,
        data.employee_type ? data.employee_type.toLowerCase().replace('-', '_') : null,
        data.payroll?.base_salary || data.base_salary || null,
        data.payroll?.pay_frequency || data.pay_frequency || null,
        data.payroll?.bank_name || data.bank_name || null,
        data.payroll?.bank_account || data.bank_account_number || null,
        data.contract_type || null,
        data.reports_to || null,
        data.deputy_manager || null,
        data.department_id || null,
        data.job_id || null,
        data.job_level_id || null,
        data.job_level_name || null
      ];
      const { rows: employmentRows } = await client.query(updateEmploymentQuery, updateEmploymentValues);
      const employmentDetailId = employmentRows[0]?.id;

      // Clear and re-insert emergency contacts
      await client.query('DELETE FROM employee_emergency_contacts WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);
      if (Array.isArray(data.emergency_contacts)) {
        for (const c of data.emergency_contacts) {
          await client.query(
            `INSERT INTO employee_emergency_contacts 
              (company_id, employee_id, contact_name, relationship, phone, national_id_number, national_id_attachment)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [companyId, employeeId, c.name || c.contact_name, c.relationship, c.phone, c.national_id || null, c.attachment || null]
          );
        }
      }

      // Clear and re-insert skills & certifications
      await client.query('DELETE FROM employee_skills_certifications WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);
      // Support two payload shapes:
      // - frontend may send `skills_certifications` combined JSON (from FormData)
      // - or separate `skills` array and `certifications` array
      let skillsCertsPayload = data.skills_certifications;
      if (typeof skillsCertsPayload === 'string') {
        try { skillsCertsPayload = JSON.parse(skillsCertsPayload); } catch (e) { skillsCertsPayload = null; }
      }

      if (Array.isArray(skillsCertsPayload) && skillsCertsPayload.length) {
        for (const sc of skillsCertsPayload) {
          // If payload row is a skill only
          if (sc.skill_name) {
            await client.query(
              `INSERT INTO employee_skills_certifications (company_id, employee_id, skill_name)
               VALUES ($1, $2, $3)`,
              [companyId, employeeId, sc.skill_name]
            );
          }
          // If payload row contains certification info
          if (sc.certification_name) {
            await client.query(
              `INSERT INTO employee_skills_certifications (company_id, employee_id, certification_name, issued_by, expiry_date, attachment)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [companyId, employeeId, sc.certification_name || null, sc.issued_by || sc.issuedBy || null, sc.expiry_date || sc.expiryDate || null, sc.attachment || null]
            );
          }
        }
      } else {
        // Fallback: separate arrays
        if (Array.isArray(data.skills)) {
          for (const skill of data.skills) {
            await client.query(
              `INSERT INTO employee_skills_certifications (company_id, employee_id, skill_name)
               VALUES ($1, $2, $3)`,
              [companyId, employeeId, skill]
            );
          }
        }
        if (Array.isArray(data.certifications)) {
          for (const cert of data.certifications) {
            await client.query(
              `INSERT INTO employee_skills_certifications (company_id, employee_id, certification_name, issued_by, expiry_date, attachment)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [companyId, employeeId, cert.name || cert.certification_name || null, cert.issuedBy || cert.issued_by || null, cert.expiryDate || cert.expiry_date || null, cert.attachment || null]
            );
          }
        }
      }

      // Synchronize System Access (User Account)
      if (data.create_user_account !== undefined) {
        try {
          // 1. Check if a user currently exists for the employee's email
          const currentEmail = data.email || rows[0].email;
          const { rows: existingUserRows } = await client.query(
            `SELECT u.user_id FROM users u 
             JOIN user_profiles p ON p.company_id = u.company_id AND p.user_id = u.user_id
             WHERE u.company_id = $1 AND p.email = $2 LIMIT 1`,
            [companyId, currentEmail]
          );
          const userExists = existingUserRows.length > 0;
          const shouldHaveUser = String(data.create_user_account) === 'true';

          if (shouldHaveUser && !userExists) {
            // Provision user account
            await UserModel.create(companyId, {
              name: data.full_name || rows[0].name,
              email: currentEmail,
              phone: data.phone_number || rows[0].phone_number,
              password: '0000',
              role: 'staff'
            });
          } else if (!shouldHaveUser && userExists) {
            // De-provision user account
            await UserModel.remove(companyId, existingUserRows[0].user_id);
          }
        } catch (e) {
          console.error('Failed to synchronize user access during employee update:', e);
          throw new Error('Employee updated but failed to synchronize system access.');
        }
      }

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating employee:', error);
      throw new Error('Could not update employee');
    } finally {
      client.release();
    }
  },

  // ✅ DELETE EMPLOYEE + related rows
  async remove(companyId, employeeId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Remove rows from tables that reference the employment detail id first
      await client.query(
        `DELETE FROM employee_part_time_schedule WHERE employment_detail_id IN (
            SELECT id FROM employee_employment_details WHERE company_id = $1 AND employee_id = $2
         )`,
        [companyId, employeeId]
      );

      await client.query(
        `DELETE FROM employee_part_time_details WHERE employment_detail_id IN (
            SELECT id FROM employee_employment_details WHERE company_id = $1 AND employee_id = $2
         )`,
        [companyId, employeeId]
      );

      await client.query(
        `DELETE FROM employee_full_time_details WHERE employment_detail_id IN (
            SELECT id FROM employee_employment_details WHERE company_id = $1 AND employee_id = $2
         )`,
        [companyId, employeeId]
      );

      await client.query(
        `DELETE FROM employee_contractor_details WHERE employment_detail_id IN (
            SELECT id FROM employee_employment_details WHERE company_id = $1 AND employee_id = $2
         )`,
        [companyId, employeeId]
      );

      // Delete employment details
      await client.query('DELETE FROM employee_employment_details WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);

      // Delete other related tables that use company_id + employee_id
      await client.query('DELETE FROM employee_emergency_contacts WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);
      await client.query('DELETE FROM employee_skills_certifications WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);
      await client.query('DELETE FROM employee_leave_balances WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);

      const { rowCount } = await client.query('DELETE FROM employees WHERE company_id = $1 AND employee_id = $2', [companyId, employeeId]);
      await client.query('COMMIT');
      return rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting employee:', error);
      throw new Error('Could not delete employee');
    } finally {
      client.release();
    }
  },

  // Update only the status field for an employee
  async updateStatus(companyId, employeeId, status) {
    try {
      const { rows } = await pool.query(
        `UPDATE employees SET status = $3, updated_at = NOW() WHERE company_id = $1 AND employee_id = $2 RETURNING *`,
        [companyId, employeeId, status]
      );
      const updated = rows[0] || null;

      if (!updated) return null;

      // Attempt to find a corresponding user by employee email
      try {
        const email = updated.email;
        if (email) {
          const { rows: userRows } = await pool.query(
            `SELECT u.user_id FROM users u
             JOIN user_profiles p ON p.company_id = u.company_id AND p.user_id = u.user_id
             WHERE u.company_id = $1 AND p.email = $2 LIMIT 1`,
            [companyId, email]
          );
          const user = userRows[0];
          if (user) {
            if (String(status).toLowerCase() === 'active') {
              await UserModel.activate(companyId, user.user_id);
            } else if (['inactive', 'deactivated'].includes(String(status).toLowerCase())) {
              await UserModel.deactivate(companyId, user.user_id);
            }
          }
        }
      } catch (e) {
        // Non-fatal: log and continue returning updated employee
        console.error('Error syncing user activation status:', e);
      }

      return updated;
    } catch (err) {
      console.error('Error updating employee status:', err);
      throw err;
    }
  },

  async getInfo(companyId) {

    try {
      const department = await DepartmentModel.findAllWithJobs(companyId);
      // LocationsModel is a default-exported class; create an instance first
      const locationsInstance = new LocationsModel();
      const locations = await locationsInstance.getLocationsByCompany(companyId);

      return { department, locations };
    } catch (err) {
      console.error('Error fetching employee info:', err);
      throw err;
    }
  },


  async promoteEmployee(companyId, employeeId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current employment details
      const { rows: currentDetails } = await client.query(
        `SELECT * FROM employee_employment_details 
         WHERE company_id = $1 AND employee_id = $2 
         ORDER BY effective_from DESC, created_at DESC LIMIT 1`,
        [companyId, employeeId]
      );

      if (!currentDetails.length) {
        throw new Error('Employee employment details not found');
      }

      const current = currentDetails[0];

      // Check if employee has a job level assigned
      if (!current.department_id || !current.job_id || !current.job_level_id) {
        throw new Error('Employee does not have a job level assigned. Please assign a level first before promoting.');
      }

      // Get current level details
      const { rows: currentLevels } = await client.query(
        `SELECT * FROM job_levels 
         WHERE company_id = $1 AND department_id = $2 AND job_id = $3 AND level_id = $4`,
        [companyId, current.department_id, current.job_id, current.job_level_id]
      );

      if (!currentLevels.length) {
        throw new Error('Current job level not found in system');
      }

      const currentLevel = currentLevels[0];

      // Find next level (level_order + 1)
      const { rows: nextLevels } = await client.query(
        `SELECT * FROM job_levels 
         WHERE company_id = $1 AND department_id = $2 AND job_id = $3 AND level_order = $4
         ORDER BY level_order ASC LIMIT 1`,
        [companyId, current.department_id, current.job_id, currentLevel.level_order + 1]
      );

      if (!nextLevels.length) {
        throw new Error(`Employee is already at the highest level (${currentLevel.level_name}). No further promotion available.`);
      }

      const nextLevel = nextLevels[0];

      // Create new employment detail record with promoted level
      const { rows: newDetails } = await client.query(
        `INSERT INTO employee_employment_details (
          company_id, employee_id, effective_from, work_location, department, job_title,
          hire_date, employee_type, base_salary, pay_frequency,
          bank_name, bank_account_number, contract_type, reports_to, deputy_manager,
          department_id, job_id, job_level_id, job_level_name
        ) VALUES ($1,$2,CURRENT_DATE,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [
          companyId,
          employeeId,
          current.work_location,
          current.department,
          current.job_title,
          current.hire_date,
          current.employee_type,
          current.base_salary, // Keep same salary - HR must manually adjust
          current.pay_frequency,
          current.bank_name,
          current.bank_account_number,
          current.contract_type,
          current.reports_to,
          current.deputy_manager,
          current.department_id,
          current.job_id,
          nextLevel.level_id,
          nextLevel.level_name
        ]
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: `Employee promoted from ${currentLevel.level_name} to ${nextLevel.level_name}`,
        previousLevel: {
          level_id: currentLevel.level_id,
          level_name: currentLevel.level_name,
          level_order: currentLevel.level_order
        },
        newLevel: {
          level_id: nextLevel.level_id,
          level_name: nextLevel.level_name,
          level_order: nextLevel.level_order,
          min_salary: nextLevel.min_salary,
          max_salary: nextLevel.max_salary
        },
        employmentDetail: newDetails[0]
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error promoting employee:', err);
      throw err;
    } finally {
      client.release();
    }
  }
};
