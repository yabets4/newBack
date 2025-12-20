import pool from '../../../loaders/db.loader.js';

export default class UsageMetricsModel {
  constructor() {}

  // Increment API request for a user/company
  async incrementUserRequest(userId, companyId) {
    const res = await pool.query(
      `
      INSERT INTO api_request_counts (user_id, company_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, company_id)
      DO UPDATE SET request_count = api_request_counts.request_count + 1,
                    last_request = NOW()
      RETURNING *;
      `,
      [userId, companyId]
    );
    return res.rows[0];
  }

  // Increment API request per route
  async incrementRouteRequest(route, method) {
    const res = await pool.query(
      `
      INSERT INTO api_route_counts (route, method)
      VALUES ($1, $2)
      ON CONFLICT (route, method)
      DO UPDATE SET request_count = api_route_counts.request_count + 1,
                    last_request = NOW()
      RETURNING *;
      `,
      [route, method]
    );
    return res.rows[0];
  }

  // Get usage per user/company
  async getUserMetrics(userId, companyId) {
    const res = await pool.query(
      `SELECT * FROM api_request_counts WHERE user_id = $1 AND company_id = $2`,
      [userId, companyId]
    );
    return res.rows[0];
  }

  // Get metrics per route
  async getRouteMetrics() {
    const res = await pool.query(
      `SELECT route, method, request_count, last_request FROM api_route_counts ORDER BY request_count DESC`
    );
    return res.rows;
  }

  /**
   * Get usage metrics for a company
   * If companyId is provided:
   *  - returns all users in that company with their API counts
   *  - returns the company total usage
   */
  async getCompanyUsageMetrics(companyId) {
    if (!companyId) throw new Error('companyId is required');

    // Fetch usage per user in the company
    const usersRes = await pool.query(
      `
      SELECT user_id, request_count, last_request
      FROM api_request_counts
      WHERE company_id = $1
      ORDER BY request_count DESC
      `,
      [companyId]
    );

    // Fetch total usage for the company
    const totalRes = await pool.query(
      `
      SELECT SUM(request_count) AS total_requests,
             MAX(last_request) AS last_request
      FROM api_request_counts
      WHERE company_id = $1
      `,
      [companyId]
    );

    return {
      companyId,
      total: totalRes.rows[0],
      users: usersRes.rows,
    };
  }
}
