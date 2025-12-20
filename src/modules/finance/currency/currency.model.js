import pool from '../../../loaders/db.loader.js';

export const CurrencyModel = {
  async insertCurrency(companyId, data) {
    const res = await pool.query(
      `INSERT INTO currencies (company_id, id, code, name, symbol, is_base_currency, decimal_places, last_updated, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8) RETURNING *`,
      [companyId, data.id, data.code, data.name || null, data.symbol || null, data.is_base_currency || false, data.decimal_places || 2, data.updated_by || null]
    );
    return res.rows[0];
  },

  async updateCurrency(companyId, id, data) {
    const res = await pool.query(
      `UPDATE currencies SET code=$3, name=$4, symbol=$5, is_base_currency=$6, decimal_places=$7, last_updated=NOW(), updated_by=$8
       WHERE company_id=$1 AND id=$2 RETURNING *`,
      [companyId, id, data.code, data.name || null, data.symbol || null, data.is_base_currency || false, data.decimal_places || 2, data.updated_by || null]
    );
    return res.rows[0];
  },

  async deleteCurrency(companyId, id) {
    await pool.query(`DELETE FROM currencies WHERE company_id=$1 AND id=$2`, [companyId, id]);
    return true;
  },

  async findAll(companyId) {
    const res = await pool.query(`SELECT * FROM currencies WHERE company_id = $1 ORDER BY code`, [companyId]);
    return res.rows;
  },

  async findById(companyId, id) {
    const res = await pool.query(`SELECT * FROM currencies WHERE company_id = $1 AND id = $2 LIMIT 1`, [companyId, id]);
    return res.rows[0] || null;
  },

  async addExchangeRate(companyId, currencyId, rate) {
    const res = await pool.query(
      `INSERT INTO currency_exchange_rates (company_id, currency_id, rate_date, rate, to_currency, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
      [companyId, currencyId, rate.date || null, rate.rate || null, rate.toCurrency || null]
    );
    return res.rows[0];
  },

  async deleteExchangeRate(companyId, rateId) {
    const res = await pool.query(`DELETE FROM currency_exchange_rates WHERE company_id=$1 AND id=$2`, [companyId, rateId]);
    return res.rowCount > 0;
  },

  async listExchangeRates(companyId, currencyId) {
    const res = await pool.query(`SELECT * FROM currency_exchange_rates WHERE company_id=$1 AND currency_id=$2 ORDER BY rate_date DESC`, [companyId, currencyId]);
    return res.rows;
  }
};

export default CurrencyModel;
