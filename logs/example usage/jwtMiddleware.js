import { authenticateJWT } from '../../src/middlewares/authenticateJWT.js';

r.get('/customers', authenticateJWT, async (req, res) => {
  const { user, roles, company, gps } = req.auth;

  // Only fetch customers for this company
  const result = await pool.query(
    'SELECT * FROM customers WHERE company_id = $1',
    [company]
  );

  return res.json({
    currentUser: user,
    roles,
    company,
    gps,
    data: result.rows
  });
});