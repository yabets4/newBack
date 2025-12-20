import { Router } from 'express';
import Controller from './companyProfile.controller.js';

const r = Router();

// Status actions
r.post('/:id/activate', Controller.activateCompany);
r.post('/:id/suspend', Controller.suspendCompany);
r.post('/:id/deactivate', Controller.deactivateCompany);
r.post('/:id/trial', Controller.setTrialCompany);

r.get('/', Controller.listCompanies);
r.get('/:id', Controller.getCompany);

export default r