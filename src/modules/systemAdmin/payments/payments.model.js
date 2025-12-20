import pool from '../../../loaders/db.loader.js';

export default class PaymentsModel {
  constructor() {}

  async createPayment(companyId, paymentData) {
    const {
      billing_contact_name,
      billing_email,
      billing_address,
      payment_method,
      payment_details,
    } = paymentData;

    const res = await pool.query(
      `
      INSERT INTO payments 
      (company_id, billing_contact_name, billing_email, billing_address, payment_method, payment_details)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [companyId, billing_contact_name, billing_email, billing_address, payment_method, payment_details]
    );
    return res.rows[0];
  }

  async getPaymentsByCompany(companyId) {
    const res = await pool.query(
      `SELECT * FROM payments WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    );
    return res.rows;
  }

  async getPaymentById(paymentId) {
    const res = await pool.query(
      `SELECT * FROM payments WHERE id = $1`,
      [paymentId]
    );
    return res.rows[0];
  }
}
