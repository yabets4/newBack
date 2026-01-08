import TransactionManager from '../transaction.manager.js';
import ApModel from './ap.model.js';

export const ApService = {
  async createInvoice(companyId, payload) {
    if (!payload) throw new Error('Missing invoice payload');

    // Accept either `lines` or `lineItems` from different clients and normalize
    const incomingLines = Array.isArray(payload.lines) ? payload.lines : (Array.isArray(payload.lineItems) ? payload.lineItems : []);
    if (incomingLines.length === 0) {
      throw new Error('Invoice must have at least one line');
    }

    // Normalize lines into payload.lines for downstream model usage
    payload.lines = incomingLines.map((l, idx) => ({
      line_number: l.line_number || l.id || idx + 1,
      item_id: l.item_id || l.itemId || l.item || null,
      description: l.description || l.note || l.item || '',
      quantity: Number(l.quantity) || Number(l.qty) || 0,
      unit_price: Number(l.unit_price) || Number(l.unitPrice) || Number(l.price) || 0,
      line_amount: Number(l.line_amount) || Number(l.total) || (Number(l.quantity) || 0) * (Number(l.unit_price) || Number(l.unitPrice) || 0),
      po_id: l.po_id || l.poId || null,
      grn_id: l.grn_id || l.grnId || null,
    }));

    // Basic total calculation
    const total = payload.lines.reduce((s, l) => s + (Number(l.line_amount) || 0), 0);
    payload.total_amount = total;
    payload.status = 'Posted'; // GOVERNANCE: auto-post to lock record

    // Delegate to Transaction Manager for Unified Control
    // Note: We're passing 'AP_INVOICE_CREATE'. We need to ensure a Mapping exists for this event
    // or specifically per invoice type if needed. For now assuming generic mapping.
    const result = await TransactionManager.handleEvent(companyId, 'AP_INVOICE_CREATE', payload, 'system'); // user?
    return result.businessRecord;
  },

  async listInvoices(companyId) {
    return await ApModel.findAll(companyId);
  },

  async getInvoice(companyId, invoiceId) {
    return await ApModel.findById(companyId, invoiceId);
  },

  // Matching logic: compare invoice lines to PO and GRN (best-effort)
  async matchInvoice(companyId, invoiceId) {
    const invoice = await ApModel.findById(companyId, invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    // For each line, attempt to find corresponding PO line and GRN line and check qty/price
    for (const line of invoice.lines) {
      // attempt to fetch PO line (if po_id present) - table name assumed `purchase_order_lines`
      if (line.po_id) {
        try {
          const poRes = await pool.query(`SELECT * FROM purchase_order_lines WHERE company_id = $1 AND po_id = $2 AND item_id = $3 LIMIT 1`, [companyId, line.po_id, line.item_id]);
          if (poRes.rows.length === 0) {
            await ApModel.addDiscrepancy(companyId, invoiceId, line.line_number, 'PO_MISSING', `PO line not found for PO ${line.po_id} item ${line.item_id}`);
            await ApModel.updateStatus(companyId, invoiceId, 'Flagged');
            continue;
          }
          const poLine = poRes.rows[0];
          // quantity check
          if (Number(poLine.quantity || 0) !== Number(line.quantity || 0)) {
            await ApModel.addDiscrepancy(companyId, invoiceId, line.line_number, 'QTY_MISMATCH', `Invoice qty ${line.quantity} vs PO qty ${poLine.quantity}`);
            await ApModel.updateStatus(companyId, invoiceId, 'Flagged');
          }
          // price check
          if (Number(poLine.unit_price || 0) !== Number(line.unit_price || 0)) {
            await ApModel.addDiscrepancy(companyId, invoiceId, line.line_number, 'PRICE_MISMATCH', `Invoice price ${line.unit_price} vs PO price ${poLine.unit_price}`);
            await ApModel.updateStatus(companyId, invoiceId, 'Flagged');
          }
        } catch (err) {
          // if PO table missing or query fails, add a generic warning but continue
          await ApModel.addDiscrepancy(companyId, invoiceId, line.line_number, 'PO_ERROR', `Error checking PO ${line.po_id}: ${err.message}`);
        }
      }

      // attempt GRN check similarly
      if (line.grn_id) {
        try {
          const grnRes = await pool.query(`SELECT * FROM goods_received_lines WHERE company_id = $1 AND grn_id = $2 AND item_id = $3 LIMIT 1`, [companyId, line.grn_id, line.item_id]);
          if (grnRes.rows.length === 0) {
            await ApModel.addDiscrepancy(companyId, invoiceId, line.line_number, 'GRN_MISSING', `GRN line not found for GRN ${line.grn_id} item ${line.item_id}`);
            await ApModel.updateStatus(companyId, invoiceId, 'Flagged');
            continue;
          }
          const grnLine = grnRes.rows[0];
          if (Number(grnLine.quantity || 0) !== Number(line.quantity || 0)) {
            await ApModel.addDiscrepancy(companyId, invoiceId, line.line_number, 'QTY_MISMATCH_GRN', `Invoice qty ${line.quantity} vs GRN qty ${grnLine.quantity}`);
            await ApModel.updateStatus(companyId, invoiceId, 'Flagged');
          }
        } catch (err) {
          await ApModel.addDiscrepancy(companyId, invoiceId, line.line_number, 'GRN_ERROR', `Error checking GRN ${line.grn_id}: ${err.message}`);
        }
      }
    }

    // If no discrepancies were recorded, mark Matched
    const disc = await pool.query(`SELECT 1 FROM ap_discrepancies WHERE company_id = $1 AND invoice_id = $2 LIMIT 1`, [companyId, invoiceId]);
    if (disc.rows.length === 0) {
      await ApModel.updateStatus(companyId, invoiceId, 'Matched');
    }

    return await ApModel.findById(companyId, invoiceId);
  },

  /**
   * Reverses an AP Invoice via TransactionManager.
   */
  async reverseInvoice(companyId, invoiceId, reason, user) {
    return await TransactionManager.reverseTransaction(companyId, 'AP', invoiceId, reason, user);
  },

  async updateInvoice(companyId, invoiceId, payload) {
    throw new Error('Direct updates to posted invoices are disabled. Use reversal and recreation.');
  },

  async deleteInvoice(companyId, invoiceId) {
    throw new Error('Deletion of posted invoices is disabled. Use reversal.');
  }
};

export default ApService;
