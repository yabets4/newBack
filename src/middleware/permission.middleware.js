import { forbidden } from '../utils/apiResponse.js';
import pool from '../loaders/db.loader.js';

export default function permission(requiredPermission) {
  return async (req, res, next) => {
    // 1. Get user roles from JWT
    const userRoles = req.auth?.roles || req.user?.roles || [];
    const companyId = req.auth?.companyID || req.user?.company_id;

    // 2. Bypass for owner/super_admin
    if (userRoles.includes('owner') || userRoles.includes('super_admin') || userRoles.includes('sub_admin') ) {
      return next();
    }

    if (!requiredPermission) return next();

    try {
      // 3. Fetch permissions for these roles
      // userRoles is something like ["Manager", "Editor"]
      // We need to find rows in 'roles' table where name IN (...) and company_id match
      // Then collect all permissions from those roles.

      const { rows } = await pool.query(
        `SELECT permissions FROM roles WHERE company_id=$1 AND name = ANY($2::text[])`,
        [companyId, userRoles]
      );

      // rows = [{ permissions: ["perm1", "perm2"] }, { permissions: ["perm3"] }]
      const allPermissions = new Set();
      rows.forEach(row => {
        if (Array.isArray(row.permissions)) {
          row.permissions.forEach(p => allPermissions.add(p));
        }
      });

      // 4. Check if requiredPermission is present
      // requiredPermission can be a string or array of strings (require ALL or ANY? usually ANY)
      const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
      const hasPermission = required.some(reqPerm => allPermissions.has(reqPerm));

      if (hasPermission) {
        return next();
      }

      return forbidden(res, `Insufficient permissions: ${required.join(', ')}`);

    } catch (err) {
      console.error('Permission check failed:', err);
      return forbidden(res, 'Permission check failed');
    }
  };
}
