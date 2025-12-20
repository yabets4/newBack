import MappingModel from './mapping.model.js';

export const MappingService = {
  // payload may include amount or fields used by formula
  async apply(companyId, eventType, payload = {}) {
    const mapping = await MappingModel.findByEvent(companyId, eventType);
    if (!mapping) return null;

    // Simple implementation: support fixed amount provided in payload.amount or mapping.amount_formula could be a numeric string
    let amount = null;
    if (typeof payload.amount === 'number') amount = payload.amount;
    else if (mapping.amount_formula) {
      // Very small and unsafe evaluator for simple numeric formulas like "amount*0.1" when payload defines amount
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('payload', `return ${mapping.amount_formula}`);
        amount = Number(fn(payload));
      } catch (e) {
        amount = null;
      }
    }

    if (amount == null) {
      // no amount -> cannot generate lines
      return null;
    }

    const lines = [
      { account_id: mapping.debit_account_id, description: mapping.description_template || null, debit: amount, credit: 0 },
      { account_id: mapping.credit_account_id, description: mapping.description_template || null, debit: 0, credit: amount },
    ];

    return lines;
  }
};

export default MappingService;
