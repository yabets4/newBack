import pool from '../../../loaders/db.loader.js';

export const MappingModel = {
  async findByEvent(companyId, eventType) {
    const res = await pool.query(`SELECT * FROM journal_mappings WHERE company_id = $1 AND event_type = $2 LIMIT 1`, [companyId, eventType]);
    return res.rows[0] || null;
  },

  async insert(companyId, mapping) {
    const res = await pool.query(`INSERT INTO journal_mappings (company_id, event_type, debit_account_id, credit_account_id, amount_formula, description_template, created_at) VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`, [companyId, mapping.event_type, mapping.debit_account_id, mapping.credit_account_id, mapping.amount_formula || null, mapping.description_template || null]);
    return res.rows[0];
  }
};

export default MappingModel;
