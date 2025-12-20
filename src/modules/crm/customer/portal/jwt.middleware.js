import jwt from 'jsonwebtoken';
import { appConfig } from '../../../../config/index.js';
import { unauthorized } from '../../../../utils/apiResponse.js';

// Middleware to validate portal JWT and ensure the token represents a customer.
// It verifies the JWT directly and sets `req.customer = { company_id, customer_id, roles, gps }` on success.
export const authenticatePortalJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, appConfig.jwtSecret);

    const roles = decoded.roles || [];
    if (!roles.includes('customer')) {
      return unauthorized(res, 'Forbidden: not a customer');
    }

    // Prefer explicit fields in token, fall back to sub format "company:customer"
    let company_id = decoded.company_id || null;
    let customer_id = decoded.customer_id || null;
    const sub = decoded.sub || '';
    if ((!company_id || !customer_id) && sub) {
      const parts = String(sub).split(':');
      company_id = company_id || parts[0] || null;
      customer_id = customer_id || parts[1] || null;
    }

    if (!company_id || !customer_id) {
      return unauthorized(res, 'Invalid customer token');
    }

    req.customer = {
      company_id,
      customer_id,
      roles,
      gps: decoded.gps || {},
    };

    return next();
  } catch (err) {
    return unauthorized(res, 'Invalid token');
  }
};

export default authenticatePortalJWT;
