import pool from '../../../loaders/db.loader.js';

export const ForecastingService = {
  async getBaseMetrics(companyId, baseYear) {
    const params = [companyId];
    let yearWhere = '';
    if (baseYear) { params.push(baseYear); yearWhere = `AND EXTRACT(YEAR FROM le.posting_date) = $${params.length}`; }

    const sql = `
      SELECT coa.account_id, coa.account_name, coa.account_type, coa.report_group,
             COALESCE(SUM(le.debit),0) AS debit,
             COALESCE(SUM(le.credit),0) AS credit
      FROM ledger_entries le
      JOIN chart_of_accounts coa
        ON coa.company_id = le.company_id AND coa.account_id = le.account_id
      WHERE le.company_id = $1
      ${yearWhere}
      GROUP BY coa.account_id, coa.account_name, coa.account_type, coa.report_group
    `;

    const res = await pool.query(sql, params);
    const rows = res.rows || [];

    let revenue = 0;
    let cogs = 0;
    let operatingExpenses = 0;
    let startingCash = 0;

    rows.forEach(r => {
      const debit = Number(r.debit) || 0;
      const credit = Number(r.credit) || 0;
      const reportGroup = (r.report_group || '').toLowerCase();
      const name = (r.account_name || '').toLowerCase();

      if (r.account_type === 'Revenue') {
        revenue += (credit - debit);
      } else if (r.account_type === 'Expense') {
        if (reportGroup.includes('cogs') || name.includes('cogs') || name.includes('cost of goods')) {
          cogs += (debit - credit);
        } else {
          operatingExpenses += (debit - credit);
        }
      } else if (r.account_type === 'Asset') {
        // treat cash/bank like starting cash
        if (reportGroup.includes('cash') || name.includes('cash') || name.includes('bank')) {
          startingCash += (Number(r.debit) - Number(r.credit));
        }
      }
    });

    return { baseYear: baseYear || null, revenue, cogs, operatingExpenses, startingCash };
  },

  async runForecast(companyId, opts = {}) {
    const {
      periods = 3,
      revenue_growth_rate = 0.1,
      cogs_pct = 0.4,
      opex_growth_rate = 0.05,
      collections_days = 30,
      payment_days = 45,
      baseYear = null,
    } = opts;

    const base = await this.getBaseMetrics(companyId, baseYear);

    const results = [];
    const startYear = baseYear || (new Date().getFullYear() - 1);

    let last = {
      year: startYear,
      revenue: Number(base.revenue) || 0,
      cogs: Number(base.cogs) || 0,
      gross_profit: (Number(base.revenue) || 0) - (Number(base.cogs) || 0),
      opex: Number(base.operatingExpenses) || 0,
      net_income: (Number(base.revenue) || 0) - (Number(base.cogs) || 0) - (Number(base.operatingExpenses) || 0),
      ar: ((Number(base.revenue) || 0) / 365) * collections_days,
      ap: (((Number(base.cogs) || 0) + (Number(base.operatingExpenses) || 0)) / 365) * payment_days,
      beginning_cash: Number(base.startingCash) || 0,
      ending_cash: Number(base.startingCash) || 0,
    };

    results.push(last);

    for (let i = 1; i <= periods; i++) {
      const forecastedRevenue = last.revenue * (1 + Number(revenue_growth_rate));
      const forecastedCogs = forecastedRevenue * Number(cogs_pct);
      const forecastedGrossProfit = forecastedRevenue - forecastedCogs;
      const forecastedOpex = last.opex * (1 + Number(opex_growth_rate));
      const forecastedNetIncome = forecastedGrossProfit - forecastedOpex;

      const newAR = (forecastedRevenue / 365) * collections_days;
      const changeInAR = newAR - last.ar;

      const newAP = ((forecastedCogs + forecastedOpex) / 365) * payment_days;
      const changeInAP = newAP - last.ap;

      const cashFromOperations = forecastedNetIncome + changeInAR - changeInAP;
      const endingCash = last.ending_cash + cashFromOperations;

      last = {
        year: startYear + i,
        revenue: forecastedRevenue,
        cogs: forecastedCogs,
        gross_profit: forecastedGrossProfit,
        opex: forecastedOpex,
        net_income: forecastedNetIncome,
        ar: newAR,
        ap: newAP,
        cash_from_operations: cashFromOperations,
        beginning_cash: last.ending_cash,
        ending_cash: endingCash,
      };

      results.push(last);
    }

    return { base, forecasts: results };
  }
};

export default ForecastingService;
