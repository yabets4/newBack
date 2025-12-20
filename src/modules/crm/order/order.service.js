import { OrderModel } from './order.model.js';

export default class OrderService {
  async getAllOrders(prefix, options) {
    return OrderModel.findAll(prefix, options);
  }

  async getOrderById(prefix, orderId) {
    return OrderModel.findById(prefix, orderId);
  }

  async createOrder(prefix, data) {
    return OrderModel.create(prefix, data);
  }

  async updateOrder(prefix, orderId, data) {
    return OrderModel.update(prefix, orderId, data);
  }

  async deleteOrder(prefix, orderId) {
    return OrderModel.remove(prefix, orderId);
  }

  async getLeadsWithQuotes(companyId) {
    return OrderModel.getLeadsWithQuotes(companyId);
  }
}
