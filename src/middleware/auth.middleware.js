import jwt from 'jsonwebtoken';
import { appConfig } from '../config/index.js';
import { unauthorized } from '../utils/apiResponse.js';

export default function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (!required) return next();
      return unauthorized(res, 'Missing token');
    }
    try {
      req.user = jwt.verify(token, appConfig.jwtSecret);
      return next();
    } catch (e) {
      return unauthorized(res, 'Invalid token');
    }
  };
}
