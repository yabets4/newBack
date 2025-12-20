import rateLimit from 'express-rate-limit';
import { appConfig } from '../config/index.js';

const limiter = rateLimit({
  windowMs: appConfig.rate.windowMs,
  max: appConfig.rate.max,
  standardHeaders: true,
  legacyHeaders: false,
});

export default limiter;
