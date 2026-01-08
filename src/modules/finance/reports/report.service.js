import pool from '../../../loaders/db.loader.js';

export const FinanceReportService = {
  async incomeStatement(companyId, { startDate, endDate } = {}) {
    const params = [companyId];
    let where = 'WHERE le.company_id = $1';
    if (startDate) { params.push(startDate); where += ` AND le.posting_date >= $${params.length}`; }
    if (endDate) { params.push(endDate); where += ` AND le.posting_date <= $${params.length}`; }

    const sql = `
      SELECT coa.account_id, coa.account_name, coa.account_number, coa.account_type,
             COALESCE(SUM(le.debit),0) AS debit,
             COALESCE(SUM(le.credit),0) AS credit
      FROM ledger_entries le
      JOIN chart_of_accounts coa
        ON coa.company_id = le.company_id AND coa.account_id = le.account_id
      ${where}
      GROUP BY coa.account_id, coa.account_name, coa.account_number, coa.account_type
      ORDER BY coa.account_number NULLS LAST, coa.account_name
    `;

    const res = await pool.query(sql, params);
    const rows = res.rows || [];

    // Map rows into revenue/expense buckets
    const revenues = [];
    const expenses = [];
    let totalRevenue = 0;
    let totalExpense = 0;

    rows.forEach(r => {
      const debit = Number(r.debit) || 0;
      const credit = Number(r.credit) || 0;
      const amount = r.account_type === 'Revenue' ? (credit - debit) : (debit - credit);
      const item = {
        accountId: r.account_id,
        accountNumber: r.account_number,
        accountName: r.account_name,
        accountType: r.account_type,
        debit,
        credit,
        amount,
      };
      if (r.account_type === 'Revenue') {
        revenues.push(item);
        totalRevenue += amount;
      } else if (r.account_type === 'Expense') {
        expenses.push(item);
        totalExpense += amount;
      }
    });

    const netIncome = totalRevenue - totalExpense;

    return {
      startDate: startDate || null,
      endDate: endDate || null,
      revenues,
      expenses,
      totalRevenue,
      totalExpense,
      netIncome,
    };
  },

  async balanceSheet(companyId, { asOfDate } = {}) {
    const params = [companyId];
    let where = 'WHERE le.company_id = $1';
    if (asOfDate) { params.push(asOfDate); where += ` AND le.posting_date <= $${params.length}`; }

    const sql = `
      SELECT coa.account_id, coa.account_name, coa.account_number, coa.account_type, coa.report_group,
             COALESCE(SUM(le.debit),0) AS debit,
             COALESCE(SUM(le.credit),0) AS credit
      FROM ledger_entries le
      JOIN chart_of_accounts coa
        ON coa.company_id = le.company_id AND coa.account_id = le.account_id
      ${where}
      GROUP BY coa.account_id, coa.account_name, coa.account_number, coa.account_type, coa.report_group
      ORDER BY coa.account_type, coa.report_group NULLS LAST, coa.account_number NULLS LAST, coa.account_name
    `;

    const res = await pool.query(sql, params);
    const rows = res.rows || [];

    const assets = {};
    const liabilities = {};
    const equity = {};
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    rows.forEach(r => {
      const debit = Number(r.debit) || 0;
      const credit = Number(r.credit) || 0;
      const group = r.report_group || 'Ungrouped';
      const account = {
        accountId: r.account_id,
        accountNumber: r.account_number,
        accountName: r.account_name,
        reportGroup: r.report_group || null,
      };

      if (r.account_type === 'Asset') {
        const balance = debit - credit;
        if (Math.abs(balance) < 0.0001) return;
        account.balance = balance;
        if (!assets[group]) assets[group] = [];
        assets[group].push(account);
        totalAssets += balance;
      } else if (r.account_type === 'Liability') {
        const balance = credit - debit;
        if (Math.abs(balance) < 0.0001) return;
        account.balance = balance;
        if (!liabilities[group]) liabilities[group] = [];
        liabilities[group].push(account);
        totalLiabilities += balance;
      } else if (r.account_type === 'Equity') {
        const balance = credit - debit;
        if (Math.abs(balance) < 0.0001) return;
        account.balance = balance;
        if (!equity[group]) equity[group] = [];
        equity[group].push(account);
        totalEquity += balance;
      }
    });

    const totalLiabilitiesEquity = totalLiabilities + totalEquity;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01;

    return {
      asOfDate: asOfDate || null,
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesEquity,
      isBalanced,
    };
  },

  async cashFlow(companyId, { startDate, endDate } = {}) {
    const baseParams = [companyId];
    let where = 'WHERE le.company_id = $1';
    if (startDate) { baseParams.push(startDate); where += ` AND le.posting_date >= $${baseParams.length}`; }
    if (endDate) { baseParams.push(endDate); where += ` AND le.posting_date <= $${baseParams.length}`; }

    const cashFilter = "(LOWER(COALESCE(coa.report_group, '')) LIKE '%cash%' OR LOWER(coa.account_name) LIKE '%cash%' OR LOWER(coa.account_name) LIKE '%bank%')";
    const cashWhere = `${where} AND ${cashFilter} AND coa.account_type = 'Asset'`;

    const cashSql = `
      SELECT coa.account_id, coa.account_name, coa.account_number, coa.report_group,
             COALESCE(SUM(le.debit),0) AS debit,
             COALESCE(SUM(le.credit),0) AS credit
      FROM ledger_entries le
      JOIN chart_of_accounts coa
        ON coa.company_id = le.company_id AND coa.account_id = le.account_id
      ${cashWhere}
      GROUP BY coa.account_id, coa.account_name, coa.account_number, coa.report_group
      ORDER BY coa.account_number NULLS LAST, coa.account_name
    `;

    const { rows = [] } = await pool.query(cashSql, baseParams);

    const categorize = (reportGroup) => {
      const rg = (reportGroup || '').toLowerCase();
      if (rg.includes('invest')) return 'Investing';
      if (rg.includes('finance')) return 'Financing';
      return 'Operating';
    };

    const categories = {
      Operating: [],
      Investing: [],
      Financing: [],
    };

    const totals = {
      Operating: 0,
      Investing: 0,
      Financing: 0,
    };

    rows.forEach(r => {
      const debit = Number(r.debit) || 0;
      const credit = Number(r.credit) || 0;
      const net = debit - credit; // asset natural balance: positive means cash inflow
      if (Math.abs(net) < 0.0001) return;
      const activity = categorize(r.report_group);
      categories[activity].push({
        accountId: r.account_id,
        accountNumber: r.account_number,
        accountName: r.account_name,
        reportGroup: r.report_group || null,
        net,
      });
      totals[activity] += net;
    });

    let startingCash = null;
    if (startDate) {
      const startParams = [companyId, startDate];
      const startSql = `
        SELECT COALESCE(SUM(le.debit - le.credit),0) AS balance
        FROM ledger_entries le
        JOIN chart_of_accounts coa
          ON coa.company_id = le.company_id AND coa.account_id = le.account_id
        WHERE le.company_id = $1
          AND le.posting_date < $2
          AND ${cashFilter}
          AND coa.account_type = 'Asset'
      `;
      const startRes = await pool.query(startSql, startParams);
      startingCash = Number(startRes?.rows?.[0]?.balance ?? 0);
    }

    const netChange = totals.Operating + totals.Investing + totals.Financing;
    const endingCash = startingCash !== null ? startingCash + netChange : null;

    return {
      startDate: startDate || null,
      endDate: endDate || null,
      operating: { entries: categories.Operating, total: totals.Operating },
      investing: { entries: categories.Investing, total: totals.Investing },
      financing: { entries: categories.Financing, total: totals.Financing },
      netChange,
      startingCash,
      endingCash,
    };
  },

  async customReport(companyId, { startDate, endDate, accountIds = [] } = {}) {
    const params = [companyId];
    let where = 'WHERE le.company_id = $1';
    if (startDate) { params.push(startDate); where += ` AND le.posting_date >= $${params.length}`; }
    if (endDate) { params.push(endDate); where += ` AND le.posting_date <= $${params.length}`; }
    if (Array.isArray(accountIds) && accountIds.length > 0) {
      params.push(accountIds);
      where += ` AND le.account_id = ANY($${params.length})`;
    }

    const sql = `
      SELECT le.posting_date::date AS date,
             le.description,
             le.debit,
             le.credit,
             le.amount,
             le.account_id,
             coa.account_name,
             coa.account_number
      FROM ledger_entries le
      JOIN chart_of_accounts coa
        ON coa.company_id = le.company_id AND coa.account_id = le.account_id
      ${where}
      ORDER BY le.posting_date, coa.account_number NULLS LAST, coa.account_name
    `;

    const res = await pool.query(sql, params);
    const rows = (res.rows || []).map(r => ({
      date: r.date,
      description: r.description,
      accountId: r.account_id,
      accountName: r.account_name,
      accountNumber: r.account_number,
      debit: Number(r.debit) || 0,
      credit: Number(r.credit) || 0,
      amount: Number(r.amount) || 0,
    }));

    return { rows };
  },

  async listAccounts(companyId) {
    const sql = `
      SELECT account_id, account_name, account_type, report_group, account_number
      FROM chart_of_accounts
      WHERE company_id = $1
      ORDER BY account_number NULLS LAST, account_name
    `;
    const res = await pool.query(sql, [companyId]);
    return { accounts: res.rows || [] };
  },

  async kpiDashboard(companyId, { startDate, endDate } = {}) {
    const resolveRange = () => {
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
      const durationMs = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      const prevStart = new Date(prevEnd.getTime() - durationMs);
      return {
        current: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
        previous: { start: prevStart.toISOString().slice(0, 10), end: prevEnd.toISOString().slice(0, 10) },
      };
    };

    const classify = {
      isCogs: (reportGroup, name) => {
        const rg = (reportGroup || '').toLowerCase();
        const nm = (name || '').toLowerCase();
        return rg.includes('cogs') || rg.includes('cost of goods') || nm.includes('cogs') || nm.includes('cost of goods');
      },
      isCurrentAsset: (reportGroup) => {
        const rg = (reportGroup || '').toLowerCase();
        return rg.includes('current') && rg.includes('asset');
      },
      isCurrentLiability: (reportGroup) => {
        const rg = (reportGroup || '').toLowerCase();
        return rg.includes('current') && rg.includes('liab');
      },
      isDebt: (reportGroup, name) => {
        const rg = (reportGroup || '').toLowerCase();
        const nm = (name || '').toLowerCase();
        return rg.includes('debt') || nm.includes('debt') || nm.includes('loan') || nm.includes('note payable');
      }
    };

    const aggregate = async (rangeStart, rangeEnd) => {
      const params = [companyId];
      let where = 'WHERE le.company_id = $1';
      if (rangeStart) { params.push(rangeStart); where += ` AND le.posting_date >= $${params.length}`; }
      if (rangeEnd) { params.push(rangeEnd); where += ` AND le.posting_date <= $${params.length}`; }

      const sql = `
        SELECT coa.account_id, coa.account_name, coa.account_type, coa.report_group,
               COALESCE(SUM(le.debit),0) AS debit,
               COALESCE(SUM(le.credit),0) AS credit
        FROM ledger_entries le
        JOIN chart_of_accounts coa
          ON coa.company_id = le.company_id AND coa.account_id = le.account_id
        ${where}
        GROUP BY coa.account_id, coa.account_name, coa.account_type, coa.report_group
      `;

      const res = await pool.query(sql, params);
      const rows = res.rows || [];

      let revenue = 0;
      let cogs = 0;
      let operatingExpenses = 0;
      let currentAssets = 0;
      let currentLiabilities = 0;
      let totalDebt = 0;
      let totalEquity = 0;

      rows.forEach(r => {
        const debit = Number(r.debit) || 0;
        const credit = Number(r.credit) || 0;
        const reportGroup = r.report_group || '';
        const name = r.account_name || '';

        if (r.account_type === 'Revenue') {
          revenue += (credit - debit);
        } else if (r.account_type === 'Expense') {
          const amt = debit - credit;
          if (classify.isCogs(reportGroup, name)) {
            cogs += amt;
          } else {
            operatingExpenses += amt;
          }
        } else if (r.account_type === 'Asset') {
          const balance = debit - credit;
          if (classify.isCurrentAsset(reportGroup)) {
            currentAssets += balance;
          }
        } else if (r.account_type === 'Liability') {
          const balance = credit - debit;
          if (classify.isCurrentLiability(reportGroup)) {
            currentLiabilities += balance;
          }
          if (classify.isDebt(reportGroup, name)) {
            totalDebt += balance;
          }
        } else if (r.account_type === 'Equity') {
          totalEquity += (credit - debit);
        }
      });

      const netIncome = revenue - cogs - operatingExpenses;

      return {
        revenue,
        cogs,
        operatingExpenses,
        currentAssets,
        currentLiabilities,
        totalDebt,
        totalEquity,
        netIncome,
      };
    };

    const ranges = resolveRange();
    const currentPeriod = await aggregate(ranges.current.start, ranges.current.end);
    const previousPeriod = await aggregate(ranges.previous.start, ranges.previous.end);

    return {
      range: {
        startDate: ranges.current.start,
        endDate: ranges.current.end,
        previousStartDate: ranges.previous.start,
        previousEndDate: ranges.previous.end,
      },
      currentPeriod,
      previousPeriod,
    };
  }
};

export default FinanceReportService;
