import pool from '../../../loaders/db.loader.js';

export const ArModel = {
  async insertInvoice(companyId, data, externalClient = null) {
    const client = externalClient || await pool.connect();
    const shouldRelease = !externalClient;
    try {
      if (shouldRelease) await client.query('BEGIN');

      // Generate invoice id
      const nextRes = await client.query(
        `UPDATE companies SET next_ar_invoice_number = next_ar_invoice_number + 1 WHERE company_id = $1 RETURNING next_ar_invoice_number`,
        [companyId]
      );
      const nextNum = nextRes.rows[0]?.next_ar_invoice_number || Date.now();
      const invoice_id = `ARINV-${String(nextNum).padStart(6, '0')}`;

      await client.query(
        `INSERT INTO ar_invoices (company_id, invoice_id, invoice_number, customer_id, customer_name, invoice_date, due_date, description, total_amount, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING *`,
        [companyId, invoice_id, data.invoice_number || null, data.customer_id || null, data.customer_name || null, data.invoice_date || null, data.due_date || null, data.description || null, data.total_amount || 0, data.status || 'Draft']
      );

      if (Array.isArray(data.lines)) {
        let idx = 1;
        for (const l of data.lines) {
          await client.query(
            `INSERT INTO ar_invoice_lines (company_id, invoice_id, line_number, item_id, description, quantity, unit_price, line_amount)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [companyId, invoice_id, idx++, l.item_id || null, l.description || null, l.quantity || 0, l.unit_price || 0, l.line_amount || 0]
          );
        }
      }

      if (Array.isArray(data.attachments) && data.attachments.length > 0) {
        for (const a of data.attachments) {
          await client.query(
            `INSERT INTO ar_invoice_attachments (company_id, invoice_id, file_name, file_url, storage_name, created_at) VALUES ($1,$2,$3,$4,$5,NOW())`,
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
    const res = await pool.query(`SELECT * FROM ar_invoices WHERE company_id = $1 ORDER BY created_at DESC`, [companyId]);
    return res.rows;
  },

  async findById(companyId, invoiceId) {
    const invoiceRes = await pool.query(`SELECT * FROM ar_invoices WHERE company_id = $1 AND invoice_id = $2 LIMIT 1`, [companyId, invoiceId]);
    const invoice = invoiceRes.rows[0] || null;
    if (!invoice) return null;
    const linesRes = await pool.query(`SELECT * FROM ar_invoice_lines WHERE company_id = $1 AND invoice_id = $2 ORDER BY line_number`, [companyId, invoiceId]);
    invoice.lines = linesRes.rows;
    const attachRes = await pool.query(`SELECT id, file_name, file_url, storage_name, created_at FROM ar_invoice_attachments WHERE company_id = $1 AND invoice_id = $2 ORDER BY created_at`, [companyId, invoiceId]);
    invoice.attachments = attachRes.rows;
    const paymentsRes = await pool.query(`SELECT id, payment_date, amount, method, reference, created_at FROM ar_payments WHERE company_id = $1 AND invoice_id = $2 ORDER BY created_at DESC`, [companyId, invoiceId]);
    invoice.payments = paymentsRes.rows;
    return invoice;
  },

  async addPayment(companyId, invoiceId, payload) {
    const res = await pool.query(`INSERT INTO ar_payments (company_id, invoice_id, payment_date, amount, method, reference, created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`, [companyId, invoiceId, payload.payment_date || null, payload.amount || 0, payload.method || null, payload.reference || null]);
    return res.rows[0];
  },

  async updateStatus(companyId, invoiceId, status) {
    const res = await pool.query(`UPDATE ar_invoices SET status = $3, updated_at = NOW() WHERE company_id = $1 AND invoice_id = $2 RETURNING *`, [companyId, invoiceId, status]);
    return res.rows[0] || null;
  }
};

export default ArModel;
