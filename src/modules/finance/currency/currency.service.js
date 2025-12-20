import CurrencyModel from './currency.model.js';

export const CurrencyService = {
  async createCurrency(companyId, payload) {
    if (!payload || !payload.code) throw new Error('Missing currency code');
    // Use code as id by default
    const id = payload.id || String(payload.code).toUpperCase();
    const toInsert = {
      id,
      code: payload.code.toUpperCase(),
      name: payload.name || null,
      symbol: payload.symbol || null,
      is_base_currency: payload.is_base_currency || payload.isBaseCurrency || false,
      decimal_places: payload.decimal_places || payload.decimalPlaces || 2,
      updated_by: payload.updated_by || payload.updatedBy || null,
    };
    const created = await CurrencyModel.insertCurrency(companyId, toInsert);
    return created;
  },

  async updateCurrency(companyId, id, payload) {
    const toUpdate = {
      code: payload.code ? String(payload.code).toUpperCase() : payload.code,
      name: payload.name || null,
      symbol: payload.symbol || null,
      is_base_currency: payload.is_base_currency || payload.isBaseCurrency || false,
      decimal_places: payload.decimal_places || payload.decimalPlaces || 2,
      updated_by: payload.updated_by || payload.updatedBy || null,
    };
    return await CurrencyModel.updateCurrency(companyId, id, toUpdate);
  },

  async deleteCurrency(companyId, id) {
    return await CurrencyModel.deleteCurrency(companyId, id);
  },

  async listCurrencies(companyId) {
    return await CurrencyModel.findAll(companyId);
  },

  async getCurrency(companyId, id) {
    const cur = await CurrencyModel.findById(companyId, id);
    if (!cur) return null;
    const rates = await CurrencyModel.listExchangeRates(companyId, cur.id);
    cur.exchangeRates = rates;
    return cur;
  },

  async addExchangeRate(companyId, currencyId, ratePayload) {
    if (!currencyId) throw new Error('Missing currency id');
    return await CurrencyModel.addExchangeRate(companyId, currencyId, ratePayload);
  },

  async deleteExchangeRate(companyId, rateId) {
    return await CurrencyModel.deleteExchangeRate(companyId, rateId);
  }
};

export default CurrencyService;
