import pool from "../../../loaders/db.loader.js";

const ReportModel = {
  async getFullReport(companyId) {
    try {
      // -----------------------------
      // 1) FETCH CUSTOMERS & PROFILES
      // -----------------------------
      const customersRes = await pool.query(
        `SELECT cp.customer_id, cp.name AS customer_name
         FROM customer_profiles cp
         WHERE cp.company_id=$1`,
        [companyId]
      );
      const customers = customersRes.rows;

      // -----------------------------
      // 2) FETCH LEADS
      // -----------------------------
      const leadsRes = await pool.query(
        `SELECT lead_id, customer_id, name AS lead_name
         FROM leads
         WHERE company_id=$1`,
        [companyId]
      );
      const leads = leadsRes.rows;

      // -----------------------------
      // 3) FETCH QUOTES
      // -----------------------------
      const quotesRes = await pool.query(
        `SELECT quote_id, lead_id
         FROM quotes
         WHERE company_id=$1`,
        [companyId]
      );
      const quotes = quotesRes.rows;

      // -----------------------------
      // 4) FETCH ORDERS
      // -----------------------------
      const ordersRes = await pool.query(
        `SELECT order_id, lead_id, total_amount, status, delivery_date
         FROM orders
         WHERE company_id=$1`,
        [companyId]
      );
      const orders = ordersRes.rows;

      // -----------------------------
      // 5) CALCULATE METRICS
      // -----------------------------
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
      const winRate = quotes.length ? (orders.length / quotes.length) * 100 : 0;

      // Lead stats
      const leadStats = leads.reduce((acc, l) => {
        acc[l.lead_id] = { orders: 0, quotes: 0, lead_name: l.lead_name, customer_id: l.customer_id };
        return acc;
      }, {});

      quotes.forEach(q => { if (leadStats[q.lead_id]) leadStats[q.lead_id].quotes++; });
      orders.forEach(o => { if (leadStats[o.lead_id]) leadStats[o.lead_id].orders++; });

      // Forecast revenue
      const leadForecasts = Object.values(leadStats).map(stats => {
        const leadScore = stats.quotes * 20 + stats.orders * 40;
        return Math.min(1, leadScore / 100) * (stats.orders > 0 ? 1 : 0.5);
      });
      const forecastRevenue = totalRevenue + totalRevenue * 0.15 * (leadForecasts.reduce((a,b)=>a+b,0)/leadForecasts.length || 1);

      // Conversion rates
      const leadToQuoteRate = leads.length ? (quotes.length / leads.length) * 100 : 0;
      const quoteToOrderRate = quotes.length ? (orders.length / quotes.length) * 100 : 0;
      const customerConversionRate = customers.length ? (orders.length / customers.length) * 100 : 0;

      // Delivery performance
      const onTimeDeliveryRate = orders.length
        ? (orders.filter(o => !o.delivery_date || new Date(o.delivery_date) >= new Date() || o.status === "Completed").length / orders.length) * 100
        : 0;
      const delayedOrders = orders.filter(o => o.delivery_date && new Date(o.delivery_date) < new Date() && o.status !== "Completed").length;

      // -----------------------------
      // 6) TOP LEADS & CUSTOMERS
      // -----------------------------
      const topLeads = Object.values(leadStats)
        .map(l => {
          const leadScore = l.quotes * 20 + l.orders * 40;
          return { lead_id: l.lead_id, lead_name: l.lead_name, customer_id: l.customer_id, lead_score: leadScore, conversionProbability: Math.min(1, leadScore / 100) };
        })
        .sort((a,b)=>b.conversionProbability - a.conversionProbability)
        .slice(0,5);

      const customerRevenueMap = {};
      orders.forEach(o => {
        const lead = leads.find(l => l.lead_id === o.lead_id);
        if (lead) customerRevenueMap[lead.customer_id] = (customerRevenueMap[lead.customer_id] || 0) + parseFloat(o.total_amount || 0);
      });

      const topCustomers = Object.entries(customerRevenueMap)
        .map(([id, revenue]) => {
          const customer = customers.find(c => c.customer_id === id);
          return { customer_id: id, customer_name: customer?.customer_name || "Unknown", totalRevenue: revenue };
        })
        .sort((a,b)=>b.totalRevenue - a.totalRevenue)
        .slice(0,5);

      return {
        totalRevenue,
        avgOrderValue,
        winRate,
        forecastRevenue,
        leadToQuoteRate,
        quoteToOrderRate,
        customerConversionRate,
        onTimeDeliveryRate,
        delayedOrders,
        topLeads,
        topCustomers
      };

    } catch (err) {
      console.error("Error computing advanced metrics:", err);
      throw new Error("Could not generate advanced metrics");
    }
  }
};

export default ReportModel;
