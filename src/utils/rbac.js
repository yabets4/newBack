import pool from '../loaders/db.loader.js';

// RBAC helper utilities for checking user roles/permissions
const normalizeRoles = (roles) => {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles;
  try {
    return JSON.parse(roles);
  } catch (e) {
    // comma separated string
    return String(roles).split(',').map(r => r.trim()).filter(Boolean);
  }
};

const normalizePermissions = (p) => {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  try {
    return JSON.parse(p);
  } catch (e) {
    return [];
  }
};

const patternMatches = (pattern, permission) => {
  // support simple wildcard '*' in pattern
  if (pattern === '*') return true;
  if (pattern.includes('*')) {
    // escape regex except *
    const re = new RegExp('^' + pattern.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    return re.test(permission);
  }
  return pattern === permission;
};

export const getUserRoles = async (userId) => {
  const res = await pool.query(`SELECT roles FROM admin_rbac WHERE user_id = $1`, [userId]);
  const roles = res.rows[0] ? res.rows[0].roles : [];
  return normalizeRoles(roles);
};

export const getPermissionsForRoles = async (roles = []) => {
  if (!roles || roles.length === 0) return [];
  const { rows } = await pool.query(`SELECT permissions FROM admin_roles WHERE name = ANY($1)`, [roles]);
  const perms = rows.reduce((acc, r) => {
    const p = normalizePermissions(r.permissions);
    return acc.concat(p);
  }, []);
  // dedupe
  return Array.from(new Set(perms));
};

export const getUserPermissions = async (userId) => {
  const roles = await getUserRoles(userId);
  const perms = await getPermissionsForRoles(roles);
  return perms;
};

export const userHasPermission = async (userId, permission) => {
  if (!userId) return false;
  const perms = await getUserPermissions(userId);
  for (const p of perms) {
    if (patternMatches(p, permission)) return true;
  }
  return false;
};

export default {
  getUserRoles,
  getPermissionsForRoles,
  getUserPermissions,
  userHasPermission,
};
