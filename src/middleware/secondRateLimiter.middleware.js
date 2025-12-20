// rateLimiter.mjs
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2, // limit each IP to 2 requests per window
  message: {
    error: 'Too many requests from this IP, please try again after a minute',
  },
  standardHeaders: true, // `RateLimit-*` headers
  legacyHeaders: false,  // disable `X-RateLimit-*` headers
});

export default limiter;
