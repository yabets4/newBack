import { internal } from '../utils/apiResponse.js';
import logger from '../config/logger.config.js';

export default function errorMiddleware(err, req, res, next) { // eslint-disable-line
  logger.error({ err }, 'Unhandled Error');
  return internal(res, 'Server error');
}
