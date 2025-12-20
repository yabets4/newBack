import service from './payments.service.js';
import { ok, notFound } from '../../../utils/apiResponse.js';

export default class PaymentsController {
  static async createPayment(req, res, next) {
    try {
      const { companyId } = req.params;
      const data = await service.createPayment(companyId, req.body);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async getCompanyPayments(req, res, next) {
    try {
      const { companyId } = req.params;
      const data = await service.getPaymentsByCompany(companyId);
      if (!data.length) return notFound(res, 'No payments found for this company');
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }

  static async getPayment(req, res, next) {
    try {
      const { paymentId } = req.params;
      const data = await service.getPaymentById(paymentId);
      if (!data) return notFound(res, 'Payment not found');
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }
}
