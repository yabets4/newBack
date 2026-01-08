import pool from '../../../loaders/db.loader.js';

export const ApModel = {
  async insertInvoice(companyId, data, externalClient = null) {
    const client = externalClient || await pool.connect();
    const shouldRelease = !externalClient;
    try {
      if (shouldRelease) await client.query('BEGIN');

      // Generate invoice id
      const nextRes = await client.query(
        `UPDATE companies SET next_ap_invoice_number = next_ap_invoice_number + 1 WHERE company_id = $1 RETURNING next_ap_invoice_number`,
        [companyId]
      );
      const nextNum = nextRes.rows[0]?.next_ap_invoice_number || Date.now();
      const invoice_id = `INV-${String(nextNum).padStart(6, '0')}`;

      const insertRes = await client.query(
        `INSERT INTO ap_invoices (company_id, invoice_id, invoice_number, vendor_id, vendor_name, invoice_date, due_date, description, total_amount, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING *`,
        [companyId, invoice_id, data.invoice_number || null, data.vendor_id || null, data.vendor_name || null, data.invoice_date || null, data.due_date || null, data.description || null, data.total_amount || 0, data.status || 'Draft']
      );

      if (Array.isArray(data.lines)) {
        let idx = 1;
        for (const l of data.lines) {
          await client.query(
            `INSERT INTO ap_invoice_lines (company_id, invoice_id, line_number, po_id, grn_id, item_id, description, quantity, unit_price, line_amount)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [companyId, invoice_id, idx++, l.po_id || null, l.grn_id || null, l.item_id || null, l.description || null, l.quantity || 0, l.unit_price || 0, l.line_amount || 0]
          );
        }
      }
      // Persist attachments if provided (array of { file_name, file_url, storage_name })
      if (Array.isArray(data.attachments) && data.attachments.length > 0) {
        for (const a of data.attachments) {
          await client.query(
            `INSERT INTO ap_invoice_attachments (company_id, invoice_id, file_name, file_url, storage_name, created_at) VALUES ($1,$2,$3,$4,$5,NOW())`,
            [companyId, invoice_id, a.file_name || a.originalname || null, a.file_url || a.path || a.url || null, a.storage_name || a.filename || null]
          );
        }
      }


      if (shouldRelease) await client.query('COMMIT');
      return await this.findById(companyId, invoice_id);
    } catch (err) {
      if (shouldRelease) await client.query('ROLLBACK');
      throw err;
    } finally {
      if (shouldRelease) client.release();
    }
  },

  async findAll(companyId) {
    const res = await pool.query(`SELECT * FROM ap_invoices WHERE company_id = $1 ORDER BY created_at DESC`, [companyId]);
    return res.rows;
  },

  async findById(companyId, invoiceId) {
    const invoiceRes = await pool.query(`SELECT * FROM ap_invoices WHERE company_id = $1 AND invoice_id = $2 LIMIT 1`, [companyId, invoiceId]);
    const invoice = invoiceRes.rows[0] || null;
    if (!invoice) return null;
    const linesRes = await pool.query(`SELECT * FROM ap_invoice_lines WHERE company_id = $1 AND invoice_id = $2 ORDER BY line_number`, [companyId, invoiceId]);
    invoice.lines = linesRes.rows;
    const attachRes = await pool.query(`SELECT id, file_name, file_url, storage_name, created_at FROM ap_invoice_attachments WHERE company_id = $1 AND invoice_id = $2 ORDER BY created_at`, [companyId, invoiceId]);
    invoice.attachments = attachRes.rows;
    const discRes = await pool.query(`SELECT * FROM ap_discrepancies WHERE company_id = $1 AND invoice_id = $2 ORDER BY created_at`, [companyId, invoiceId]);
    invoice.discrepancies = discRes.rows;
    return invoice;
  },

  async addDiscrepancy(companyId, invoiceId, lineNumber, type, message) {
    const res = await pool.query(`INSERT INTO ap_discrepancies (company_id, invoice_id, line_number, type, message, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`, [companyId, invoiceId, lineNumber || null, type, message || null]);
    return res.rows[0];
  },

  async updateStatus(companyId, invoiceId, status) {
    const res = await pool.query(`UPDATE ap_invoices SET status = $3, updated_at = NOW() WHERE company_id = $1 AND invoice_id = $2 RETURNING *`, [companyId, invoiceId, status]);
    return res.rows[0] || null;
  }
};

export default ApModel;
