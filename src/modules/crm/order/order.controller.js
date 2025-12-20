import OrderService from './order.service.js';
import { ok, notFound, created, badRequest } from '../../../utils/apiResponse.js';

const service = new OrderService();

export default class OrderController {
  // GET /orders
  static async getAll(req, res, next) {
    try {
      const prefix = req.auth.companyID;
      const orders = await service.getAllOrders(prefix, req.query);
      return ok(res, orders);
    } catch (e) {
      next(e);
    }
  }

  // GET /orders/:id
  static async getById(req, res, next) {
    try {
      const prefix = req.auth.companyID;
      const order = await service.getOrderById(prefix, req.params.id);
      if (!order) return notFound(res, 'Order not found');
      return ok(res, order);
    } catch (e) {
      next(e);
    }
  }

  // POST /orders
  static async create(req, res, next) {
    try {
      const prefix = req.auth.companyID;
      const order = await service.createOrder(prefix, req.body);
      return created(res, order);
    } catch (e) {
      next(e);
    }
  }

  // PUT /orders/:id
  static async update(req, res, next) {
    try {
      const prefix = req.auth.companyID;
      const order = await service.updateOrder(prefix, req.params.id, req.body);
      if (!order) return notFound(res, 'Order not found');
      return ok(res, order);
    } catch (e) {
      next(e);
    }
  }

  // DELETE /orders/:id
  static async delete(req, res, next) {
    try {
      const prefix = req.auth.companyID;
      const success = await service.deleteOrder(prefix, req.params.id);
      if (!success) return notFound(res, 'Order not found');
      return ok(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  }

  // GET /orders/leads-with-quotes
  static async getLeadsWithQuotes(req, res, next) {
    try {
      const { companyID } = req.auth;
      if (!companyID) return badRequest(res, 'Company ID is required');
      const data = await service.getLeadsWithQuotes(companyID);
      return ok(res, data);
    } catch (e) {
      next(e);
    }
  }
}
