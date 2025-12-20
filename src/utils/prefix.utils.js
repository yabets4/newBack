const SAFE = /^[a-zA-Z0-9_]{1,32}$/;

export function sanitizePrefix(prefix) {
  const clean = (prefix || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (!SAFE.test(clean)) return null;
  return clean;
}

// Compose a fully-qualified table name from base and tenant prefix.
export function tableName(base, tenantPrefix) {
  if (!SAFE.test(tenantPrefix)) throw new Error('Unsafe tenant prefix');
  if (!/^[a-zA-Z0-9_]+$/.test(base)) throw new Error('Unsafe base table');
  return `${tenantPrefix}_${base}`;
}

// Remove prefix from a table string if present (utility for audits)
export function removePrefix(full, tenantPrefix) {
  const p = `${tenantPrefix}_`;
  return full.startsWith(p) ? full.slice(p.length) : full;
}
