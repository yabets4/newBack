// middlewares/checkTierLimit.js
import pool from "../loaders/db.loader.js";

// --- First check company status ---
export async function CheckCompanyStatus(req, res, next) {
  const { companyID } = req.auth;

  try {
    const companyRes = await pool.query(
        `SELECT status, pricing_tier 
        FROM company_profiles
        WHERE company_id = $1
        ORDER BY updated_at DESC  -- or id DESC if auto-increment
        LIMIT 1`,
        [companyID]
    );


    if (companyRes.rowCount === 0) {
      return res.status(403).json({ error: "Company not found" });
    }

    const { status, pricing_tier } = companyRes.rows[0];

    // Block if suspended or deactivated
    if (status === "Suspended") {
        console.log(companyID, " Company account suspended");
        
      return res.status(403).json({ error: "Company account suspended" });
    }
    if (status === "Deactivated") {
        console.log(companyID, " Company account deactivated");

      return res.status(403).json({ error: "Company account deactivated" });
    }

    // Attach tier for the next middleware to use
    req.companyTierId = pricing_tier;
    req.companyStatus = status; // Active or Trial
    next();
  } catch (err) {
    console.error("[Company Status Middleware Error]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// --- Then check resource usage against tier limits ---
export function CheckTierLimit(usageType) {
  return async (req, res, next) => {
    const { companyID } = req.auth;
    const pricingTier = req.companyTierId; // from previous middleware

    try {
      // 1. Get latest version of tier
      const tierRes = await pool.query(
        `SELECT * 
         FROM pricing_tier_versions 
         WHERE tier_id = $1 
         ORDER BY version DESC 
         LIMIT 1`,
        [pricingTier]
      );

      if (tierRes.rowCount === 0) {
        return res.status(403).json({ error: "No pricing tier found" });
      }

      const tier = tierRes.rows[0];
      let usageCount = 0;

      // 2. Count usage based on usageType
      if (usageType === "customers") {
        const usageRes = await pool.query(
          `SELECT COUNT(*)::int AS count 
           FROM customers 
           WHERE company_id = $1`,
          [companyID]
        );
        usageCount = usageRes.rows[0].count;
        if (usageCount >= tier.total_customer) {
            console.log("Customer limit reached", tier.total_customer);
          return res.status(403).json({
            error: "Customer limit reached",
            limit: tier.total_customer,
            used: usageCount,
            resource: "customers",
          });
          
          
        }
      }

      if (usageType === "leads") {
        const usageRes = await pool.query(
          `SELECT COUNT(*)::int AS count 
           FROM leads 
           WHERE company_id = $1`,
          [companyID]
        );
        usageCount = usageRes.rows[0].count;
        if (usageCount >= tier.total_leads) {
          return res.status(403).json({
            error: "Lead limit reached",
            limit: tier.total_leads,
            used: usageCount,
            resource: "leads",
          });
        }
      }

      if (usageType === "users") {
        const usageRes = await pool.query(
          `SELECT COUNT(*)::int AS count 
           FROM users 
           WHERE company_id = $1`,
          [companyID]
        );
        usageCount = usageRes.rows[0].count;
        if (usageCount >= tier.included_users) {
          return res.status(403).json({
            error: "User limit reached",
            limit: tier.included_users,
            used: usageCount,
            resource: "users",
          });
        }
      }

      // ✅ All clear
      next();
    } catch (err) {
      console.error("[Tier Middleware Error]", err);
      console.log("[Tier Middleware Error]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
