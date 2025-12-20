import jwt from 'jsonwebtoken';
import { appConfig } from '../config/index.js';
import { unauthorized } from '../utils/apiResponse.js';

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, appConfig.jwtSecret);

    // Save structured auth info
    req.auth = {
      user: decoded.sub,          
      roles: decoded.roles || [], // array of roles
      companyID: decoded.company_id, // user's company_id
      gps: decoded.gps // user's gps
    };

    next();
  } catch (err) {
    return unauthorized(res, 'Invalid token');
  }
};