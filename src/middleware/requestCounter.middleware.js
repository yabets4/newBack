// requestCounter.middleware.js
import jwt from 'jsonwebtoken';
import { appConfig } from '../config/index.js';
import pool from '../loaders/db.loader.js';

export const requestCounter = async (req, res, next) => {
  let userId = null;
  let companyId = null;

  // Decode JWT if present
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, appConfig.jwtSecret);
      userId = decoded.sub;          // matches users.user_id
      companyId = decoded.company_id; // matches users.company_id
    } catch (err) {
      console.warn("Invalid JWT:", err.message);
    }
  }

  // Track user/company requests only if companyId is present
  if (companyId) {
    try {
      await pool.query(
        `
        INSERT INTO api_request_counts (company_id, user_id, request_count, last_request)
        VALUES ($1, $2, 1, NOW())
        ON CONFLICT (company_id, user_id)
        DO UPDATE SET 
          request_count = api_request_counts.request_count + 1,
          last_request = NOW()
        `,
        [companyId, userId]
      );
    } catch (err) {
      console.error("Failed to save user/company request count:", err.message);
    }
  }

  // Track route requests
  const routePath = req.route?.path || req.path;
  const method = req.method;

  try {
    await pool.query(
      `
      INSERT INTO api_route_counts (route, method, request_count, last_request)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (route, method)
      DO UPDATE SET 
        request_count = api_route_counts.request_count + 1,
        last_request = NOW()
      `,
      [routePath, method]
    );
  } catch (err) {
    console.error("Failed to save route request count:", err.message);
  }

  next();
};

// Metrics endpoint
export const getRequestMetrics = async (req, res) => {
  try {
    // User/company metrics
    const userRows = await pool.query(
      `SELECT user_id, company_id, request_count, last_request
       FROM api_request_counts
       ORDER BY request_count DESC`
    );
    const totalUserRequests = userRows.rows.reduce((sum, r) => sum + Number(r.request_count), 0);

    // Route metrics
    const routeRows = await pool.query(
      `SELECT route, method, request_count, last_request
       FROM api_route_counts
       ORDER BY request_count DESC`
    );
    const totalRouteRequests = routeRows.rows.reduce((sum, r) => sum + Number(r.request_count), 0);

    res.json({
      totalUserRequests,
      totalRouteRequests,
      userMetrics: userRows.rows,
      routeMetrics: routeRows.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch request metrics' });
  }
};
