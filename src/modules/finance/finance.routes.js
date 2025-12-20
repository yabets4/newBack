import { Router } from 'express';
import auth from '../../middleware/auth.middleware.js';
import { authenticateJWT } from '../../middleware/jwt.middleware.js';
import { requestCounter } from '../../middleware/requestCounter.middleware.js';
import {CheckCompanyStatus} from '../../middleware/checkTierLimit.middleware.js';
import FixedaAsset from './fixedAsset/assets.routes.js';
import CoaRoutes from './coa/coa.routes.js';
import JournalRoutes from './journal/journal.routes.js';
import ApRoutes from './ap/ap.routes.js';
import CurrencyRoutes from './currency/currency.routes.js';
import ArRoutes from './ar/ar.routes.js';

const r = Router(); r.use(auth(true), authenticateJWT, CheckCompanyStatus, requestCounter );

r.use('/assets', FixedaAsset);
r.use('/coa', CoaRoutes);
r.use('/journal', JournalRoutes);
r.use('/ap', ApRoutes);
r.use('/currency', CurrencyRoutes);
r.use('/ar', ArRoutes);

export default r;
