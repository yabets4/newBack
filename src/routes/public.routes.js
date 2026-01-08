
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../loaders/db.loader.js';
import { appConfig } from '../config/index.js';
import { ok, badRequest, unauthorized } from '../utils/apiResponse.js';

const r = Router();

r.post('/auth/login', async (req, res) => {
  const { email, password, gps } = req.body || {};
  if (!email || !password || !gps) {
    return badRequest(res, 'email, password and gps required');
  }

  console.log("Reached DB query");


  try {
    // Join user_profiles -> users to get company_id and user_id
    const result = await pool.query(
      `
      SELECT 
        up.id AS profile_id,
        up.email,
        up.password,
        up.role,
        u.company_id,
        u.user_id       -- fetch the actual user_id from users
      FROM user_profiles up
      JOIN users u 
        ON up.user_id = u.user_id AND up.company_id = u.company_id
      WHERE up.email = $1
      LIMIT 1
      `,
      [email]
    );
    console.log("DB query finished");
    console.log("GPS:", gps);

    const user = result.rows[0];
    if (!user) return unauthorized(res, 'User not found');

    // TODO: use bcrypt compare in production
    if (user.password !== password) {
      return unauthorized(res, 'Invalid credentials');
    }

    console.log(user);
    console.log(user.user_id);

    // Fetch granular permissions for the user's role
    // Dynamic import to avoid circular dependency issues if any, or just standard import likely fine
    // using dynamic import just in case, or we can add top-level import.
    // simpler: assume top-level import is added.
    const { getPermissionsByRoles } = await import('../modules/system/role/role.service.js');
    const permissions = await getPermissionsByRoles([user.role], user.company_id);

    // Create JWT with correct user_id
    const token = jwt.sign(
      {
        sub: user.user_id,       // ✅ now matches users.user_id
        roles: [user.role],
        permissions,             // ✅ Added granular permissions
        company_id: user.company_id,
        gps,
      },
      appConfig.jwtSecret,
      { expiresIn: '12h' }
    );

    // Save login session
    await pool.query(
      `INSERT INTO login_sessions (email, role, gps_lat, gps_lon)
       VALUES ($1, $2, $3, $4)`,
      [user.email, user.role, gps.lat, gps.lon]
    );

    // Check if password is the default "0000"
    let require_password_change = false;
    if (password === '0000') {
      require_password_change = true;
    }

    return ok(res, { token, require_password_change });
  } catch (err) {
    console.error('Login error:', err);
    return badRequest(res, 'Login failed');
  }
});

r.post('/auth/change-password', async (req, res) => {
  const { email, old_password, new_password } = req.body || {};
  if (!email || !old_password || !new_password) {
    return badRequest(res, 'email, old_password, and new_password are required');
  }

  try {
    // 1. Verify old credentials
    const result = await pool.query(
      `SELECT up.password, up.user_id, up.company_id
       FROM user_profiles up
       WHERE up.email = $1 LIMIT 1`,
      [email]
    );
    const user = result.rows[0];

    if (!user) return unauthorized(res, 'User not found');
    if (user.password !== old_password) return unauthorized(res, 'Invalid old password');

    // 2. Update to new password
    await pool.query(
      `UPDATE user_profiles 
       SET password = $1, updated_at = NOW() 
       WHERE company_id = $2 AND user_id = $3`,
      [new_password, user.company_id, user.user_id]
    );

    return ok(res, { message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return badRequest(res, 'Failed to update password');
  }
});



// ---------------- Admin Login ----------------
r.post('/login', async (req, res) => {
  console.log('req.body:', req.body);
  const { email, password, gps } = req.body || {};

  if (!email || !password || !gps) {
    return badRequest(res, 'email, password and gps required');
  }

  try {
    // Fetch admin user
    const result = await pool.query(
      `SELECT user_id, name, email, password, role FROM admin_users WHERE email = $1 LIMIT 1`,
      [email]
    );
    const admin = result.rows[0];
    if (!admin) return unauthorized(res, 'Admin not found');

    // Direct password check (plain-text, can switch to bcrypt)
    if (admin.password !== password) {
      return unauthorized(res, 'Invalid credentials');
    }

    // Fetch all roles for this user directly from admin_rbac
    const rowResults = await pool.query(
      `SELECT roles
      FROM admin_rbac
      WHERE user_id = $1`,
      [admin.user_id]
    );

    // Convert to JS array (empty array if no roles)

    let userRoles = rowResults.rows[0]?.roles || [];
    if (userRoles.length === 0 && admin.role) {
      userRoles = [admin.role];
    }

    // Fetch granular permissions
    const { getPermissionsByRoles } = await import('../modules/system/role/role.service.js');
    // Admin roles might be system-wide, so companyId might be null or specific?
    // For now passing null as companyId if it's a super admin, but let's check.
    // Admin table doesn't seem to have company_id. Assuming global or handle carefully.
    const permissions = await getPermissionsByRoles(userRoles, null); // Null company for system admins?

    // Create JWT including roles
    const token = jwt.sign(
      {
        sub: admin.user_id,
        roles: userRoles,
        permissions,
        gps,
      },
      appConfig.jwtSecret,
      { expiresIn: '17h' }
    );

    // Optional: Save login session
    await pool.query(
      `INSERT INTO admin_login_sessions (user_id, email, role, gps_lat, gps_lon)
       VALUES ($1, $2, $3, $4, $5)`,
      [admin.user_id, admin.email, admin.role, gps.lat, gps.lon]
    );

    // Respond with token and basic info
    return ok(res, {
      token,
      user_id: admin.user_id,
      name: admin.name,
      role: admin.role,
      gps,
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return badRequest(res, 'Login failed');
  }
});

r.post('/auth/login-as/:company_id', async (req, res) => {
  const { company_id } = req.params;
  const { gps } = req.body || {};

  if (!gps) return badRequest(res, 'GPS required');

  try {
    // Generate JWT scoped to the target tenant company
    const token = jwt.sign(
      {
        sub: 'super-001',            // super admin user_id
        roles: ['owner'],             // can adjust role if needed
        company_id: company_id,       // tenant being impersonated
        gps,
        is_system_admin: true,        // backend will allow all-company access
        impersonator: 'super-001'
      },
      appConfig.jwtSecret,
      { expiresIn: '12h' }
    );

    // Save session for auditing
    await pool.query(
      `INSERT INTO login_sessions (email, role, gps_lat, gps_lon )
       VALUES ($1, $2, $3, $4)`,
      ['superadmin@example.com', 'owner', gps.lat, gps.lon]
    );

    return ok(res, { token, tenant: company_id });
  } catch (err) {
    console.error('Login-as error:', err);
    return badRequest(res, 'Failed to login as tenant');
  }
});

// ========== Employee Login Endpoint ==========
r.post('/employee/login', async (req, res) => {
  const { email, password } = req.body || {};
  console.log('Employee login attempt:', { email, password });
  if (!email || !password) {
    return badRequest(res, 'email and password required');
  }

  try {
    // Query employees table for matching email and join to get job_title
    const result = await pool.query(
      `SELECT e.company_id, e.employee_id, e.name, e.email, e.password, d.job_title
       FROM employees e
       LEFT JOIN employee_employment_details d
         ON e.company_id = d.company_id AND e.employee_id = d.employee_id
       WHERE e.email = $1
       ORDER BY d.effective_from DESC NULLS LAST
       LIMIT 1`,
      [email]
    );
    const employee = result.rows[0];
    if (!employee) return unauthorized(res, 'Employee not found');

    // Direct password check (plain-text, can switch to bcrypt)
    if (employee.password !== password) {
      return unauthorized(res, 'Invalid credentials');
    }

    // Create JWT for employee, use job_title instead of role
    const token = jwt.sign(
      {
        sub: employee.employee_id,
        company_id: employee.company_id,
        job_title: employee.job_title || 'employee',
      },
      appConfig.jwtSecret,
      { expiresIn: '12h' }
    );

    return ok(res, {
      token,
      employee_id: employee.employee_id,
      name: employee.name,
      company_id: employee.company_id,
      job_title: employee.job_title || 'employee',
    });
  } catch (err) {
    console.error('Employee login error:', err);
    return badRequest(res, 'Employee login failed');
  }
});


// ========== SMS Custom App Public Listener ==========

r.get('/sms/queue', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return unauthorized(res, 'X-Api-Key header required');

  try {
    const { default: smsService } = await import('../modules/notifications/sms/sms.service.js');
    const messages = await smsService.getPendingMessagesByApiKey(apiKey);
    return ok(res, { success: true, messages });
  } catch (err) {
    console.error('Public SMS queue error:', err);
    return unauthorized(res, err.message);
  }
});

r.post('/sms/status', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const { messageId, status, errorMessage } = req.body || {};

  if (!apiKey) return unauthorized(res, 'X-Api-Key header required');
  if (!messageId || !status) return badRequest(res, 'messageId and status required');

  try {
    const { default: smsService } = await import('../modules/notifications/sms/sms.service.js');
    await smsService.updateMessageStatusByApiKey(apiKey, messageId, status, errorMessage);
    return ok(res, { success: true });
  } catch (err) {
    console.error('Public SMS status error:', err);
    return unauthorized(res, err.message);
  }
});

export default r;
