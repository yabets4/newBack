import TaxModel from './tax.model.js';

// Simple tax calculation: apply configured rates to gross pay
// settings.settings expected shape: { rates: [{ name, rate }] , exemptions: number }

const TaxService = {
  async getSettings(companyId) {
    const rec = await TaxModel.getSettings(companyId);
    return rec ? rec.settings : { rates: [], exemptions: 0 };
  },

  async upsertSettings(companyId, payload) {
    const row = await TaxModel.upsertSettings(companyId, { id: 'default', settings: payload });
    return row ? row.settings : null;
  },

  async calculate(companyId, payload) {
    // payload: { grossPay, taxableBenefits }
    const settings = await this.getSettings(companyId);
    const gross = Number(payload.grossPay || 0);
    const benefits = Number(payload.taxableBenefits || 0);
    const taxableBase = Math.max(0, gross + benefits - (settings.exemptions || 0));
    let totalTax = 0;
    const breakdown = [];
    const rates = Array.isArray(settings.rates) ? settings.rates : [];
    for (const r of rates) {
      const rate = Number(r.rate || 0) / 100;
      const amount = +(taxableBase * rate).toFixed(2);
      breakdown.push({ name: r.name || 'rate', rate: Number(r.rate || 0), amount });
      totalTax += amount;
    }
    totalTax = +totalTax.toFixed(2);
    return { gross, benefits, taxableBase: +taxableBase.toFixed(2), totalTax, breakdown };
  },

  async listFilings(companyId) {
    return await TaxModel.listFilings(companyId);
  },

  async createFiling(companyId, payload) {
    // payload: { period, totalTax, data }
    return await TaxModel.createFiling(companyId, payload);
  }
};

export default TaxService;
