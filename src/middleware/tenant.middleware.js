import { badRequest } from '../utils/apiResponse.js';
import { sanitizePrefix } from '../utils/prefix.utils.js';

export default function tenantMiddleware(req, res, next) {
  let prefix;

  // 1. Check JWT (already set in req.user)
  if (req.user?.tenantPrefix) {
    prefix = req.user.tenantPrefix;
  }
  // 2. Check custom header
  else if (req.headers['x-company']) {
    prefix = req.headers['x-company'];
  }
  // 3. Check query param
  else if (req.query.company) {
    prefix = req.query.company;
  }
  // 4. Check session cookie
  else if (req.cookies?.session) {
    try {
      const sessionData = JSON.parse(req.cookies.session);
      prefix = sessionData.company;
    } catch (e) {
      return badRequest(res, 'Invalid session data');
    }
  }

  if (!prefix) return badRequest(res, 'Tenant prefix not provided');

  prefix = sanitizePrefix(String(prefix));
  if (!prefix) return badRequest(res, 'Invalid tenant prefix');

  req.tenantPrefix = prefix;
  next();
}
