import pool from '../loaders/db.loader.js';


const normalizeToArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    // if it's a JSON string
    const parsed = typeof v === 'string' ? JSON.parse(v) : v;
    if (Array.isArray(parsed)) return parsed;
    return [String(parsed)];
  } catch (e) {
    return [String(v)];
  }
};

export async function getUserRoles(userId) {
  if (!userId) return [];
  const res = await pool.query(`SELECT roles FROM admin_rbac WHERE user_id=$1 LIMIT 1`, [userId]);
  const roles = res.rows[0]?.roles;
  return normalizeToArray(roles);
}

export async function getRolesPermissions(roleNames = []) {
  if (!roleNames || roleNames.length === 0) return [];
  const res = await pool.query(`SELECT permissions FROM admin_roles WHERE name = ANY($1)`, [roleNames]);
  const perms = [];
  for (const r of res.rows) {
    const p = r.permissions;
    perms.push(...normalizeToArray(p));
  }
  // dedupe
  return Array.from(new Set(perms));
}

export async function getUserPermissions(userId) {
  const roles = await getUserRoles(userId);
  if (!roles || roles.length === 0) return [];
  const perms = await getRolesPermissions(roles);
  return perms;
}

export async function userHasPermission(userId, permission) {
  if (!userId || !permission) return false;
  const perms = await getUserPermissions(userId);
  return perms.includes(permission);
}

// Express middleware factory: requirePermission('perm:name')
export function requirePermission(permission) {
  return async function (req, res, next) {
    try {
      const userId = req.auth && (req.auth.user || req.auth.sub || req.auth.userId || req.auth.user_id);
      if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
      const ok = await userHasPermission(userId, permission);
      if (!ok) return res.status(403).json({ success: false, message: 'Forbidden' });
      next();
    } catch (e) {
      next(e);
    }
  };
}

// Middleware to attach permissions to req.auth.permissions
export async function attachPermissions(req, res, next) {
  try {
    const userId = req.auth && (req.auth.user || req.auth.sub || req.auth.userId || req.auth.user_id);
    if (!userId) {
      req.auth = req.auth || {};
      req.auth.permissions = [];
      return next();
    }
    const perms = await getUserPermissions(userId);
    req.auth = req.auth || {};
    req.auth.permissions = perms;
    next();
  } catch (e) {
    next(e);
  }
}

export default {
  getUserRoles,
  getRolesPermissions,
  getUserPermissions,
  userHasPermission,
  requirePermission,
  attachPermissions,
};
