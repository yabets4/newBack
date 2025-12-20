import ArModel from './ar.model.js';

export const ArService = {
  async createInvoice(companyId, payload) {
    if (!payload) throw new Error('Missing invoice payload');

    const incomingLines = Array.isArray(payload.lines) ? payload.lines : (Array.isArray(payload.lineItems) ? payload.lineItems : []);
    if (incomingLines.length === 0) throw new Error('Invoice must have at least one line');

    payload.lines = incomingLines.map((l, idx) => ({
      line_number: l.line_number || l.id || idx + 1,
      item_id: l.item_id || l.itemId || null,
      description: l.description || l.note || '',
      quantity: Number(l.quantity) || Number(l.qty) || 0,
      unit_price: Number(l.unit_price) || Number(l.unitPrice) || Number(l.price) || 0,
      line_amount: Number(l.line_amount) || Number(l.total) || (Number(l.quantity) || 0) * (Number(l.unit_price) || Number(l.unitPrice) || 0),
    }));

    const total = payload.lines.reduce((s, l) => s + (Number(l.line_amount) || 0), 0);
    payload.total_amount = total;

    const created = await ArModel.insertInvoice(companyId, payload);
    return created;
  },

  async listInvoices(companyId) {
    return await ArModel.findAll(companyId);
  },

  async getInvoice(companyId, invoiceId) {
    return await ArModel.findById(companyId, invoiceId);
  },

  async addPayment(companyId, invoiceId, payload) {
    if (!payload || !payload.amount) throw new Error('Missing payment amount');
    const added = await ArModel.addPayment(companyId, invoiceId, payload);
    // Optionally update invoice status if fully paid - not computing outstanding here
    return added;
  }
};

export default ArService;
