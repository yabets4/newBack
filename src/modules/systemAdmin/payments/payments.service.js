import PaymentsModel from './payments.model.js';
const model = new PaymentsModel();

export default {
  createPayment: (companyId, paymentData) =>
    model.createPayment(companyId, paymentData),

  getPaymentsByCompany: (companyId) =>
    model.getPaymentsByCompany(companyId),

  getPaymentById: (paymentId) =>
    model.getPaymentById(paymentId),
};
