import pool from '../../../loaders/db.loader.js';

export const CoaModel = {
  // List all accounts for a company
  async findAll(companyId) {
    const result = await pool.query(
      `
      SELECT *
      FROM chart_of_accounts
      WHERE company_id = $1
      ORDER BY account_number
      `,
      [companyId]
    );
    return result.rows;
  },

  async findById(companyId, accountId) {
    const result = await pool.query(
      `
      SELECT * FROM chart_of_accounts
      WHERE company_id = $1 AND account_id = $2
      LIMIT 1
      `,
      [companyId, accountId]
    );
    return result.rows[0] || null;
  },

  // Insert a new account. Generates an account_id using companies.next_account_number
  async insert(companyId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate next account id (ACC-XX)
      const nextRes = await client.query(
        `UPDATE companies
         SET next_account_number = next_account_number + 1
         WHERE company_id = $1
         RETURNING next_account_number`,
        [companyId]
      );
      const nextNum = nextRes.rows[0]?.next_account_number || Date.now();
      const account_id = `ACC-${String(nextNum).padStart(4, '0')}`;

      const insertRes = await client.query(
        `INSERT INTO chart_of_accounts (
           company_id, account_id, account_number, account_name, account_type,
           description, parent_id, balance, is_cash_flow_relevant, is_control_account,
           is_system, status, report_group, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
         RETURNING *`
        ,[
          companyId,
          account_id,
          data.account_number || null,
          data.account_name || null,
          data.account_type || null,
          data.description || null,
          data.parent_id || null,
          data.balance || 0,
          data.is_cash_flow_relevant === true,
          data.is_control_account === true,
          data.is_system === true,
          data.status || 'Active',
          data.report_group || null,
        ]
      );

      await client.query('COMMIT');
      return insertRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(companyId, accountId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updateRes = await client.query(
        `UPDATE chart_of_accounts SET
           account_number = $3,
           account_name = $4,
           account_type = $5,
           description = $6,
           parent_id = $7,
           balance = $8,
           is_cash_flow_relevant = $9,
           is_control_account = $10,
           is_system = $11,
           status = $12,
           report_group = $13,
           updated_at = NOW()
         WHERE company_id = $1 AND account_id = $2
         RETURNING *
        `,
        [
          companyId,
          accountId,
          data.account_number || null,
          data.account_name || null,
          data.account_type || null,
          data.description || null,
          data.parent_id || null,
          data.balance || 0,
          data.is_cash_flow_relevant === true,
          data.is_control_account === true,
          data.is_system === true,
          data.status || 'Active',
          data.report_group || null,
        ]
      );

      await client.query('COMMIT');
      return updateRes.rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async remove(companyId, accountId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Return the row before deletion for auditing
      const before = await client.query(
        `SELECT * FROM chart_of_accounts WHERE company_id = $1 AND account_id = $2 LIMIT 1`,
        [companyId, accountId]
      );
      if (before.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query(`DELETE FROM chart_of_accounts WHERE company_id = $1 AND account_id = $2`, [companyId, accountId]);

      await client.query('COMMIT');
      return before.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

export default CoaModel;
