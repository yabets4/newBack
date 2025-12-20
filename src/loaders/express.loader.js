import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { securityConfig } from '../config/index.js';
import errorMiddleware from '../middleware/error.middleware.js';
import rateLimitMiddleware from '../middleware/rateLimit.middleware.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function expressLoader(app) {

  // Serve the entire uploads directory at /uploads so paths like
  // /uploads/<CompanyName>/tools/... are publicly accessible.
  app.use('/uploads', cors({ origin: '*' }), express.static(path.join(__dirname, '../uploads')));

  // ---- Existing middlewares ----
  app.use(cors(securityConfig.cors));
  app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet(securityConfig.helmet));
  app.use(morgan('dev'));
  app.use(rateLimitMiddleware);


  // routes will be plugged by routes.loader
  app.use(errorMiddleware);

}
