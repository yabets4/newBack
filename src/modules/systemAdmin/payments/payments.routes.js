import { Router } from 'express';
import PaymentsController from './payments.controller.js';

const r = Router();

r.post('/:companyId', PaymentsController.createPayment);
r.get('/company/:companyId', PaymentsController.getCompanyPayments);
r.get('/:paymentId', PaymentsController.getPayment);

export default r;
