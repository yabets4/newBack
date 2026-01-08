import pool from '../../../loaders/db.loader.js';

export const FinancialPeriodModel = {
    // --- Financial Periods ---

    async findAll(companyId, filters = {}) {
        let query = `
      SELECT *
      FROM financial_periods
      WHERE company_id = $1
    `;
        const params = [companyId];
        let paramIdx = 2;

        if (filters.status) {
            query += ` AND status = $${paramIdx++}`;
            params.push(filters.status);
        }
        if (filters.year) {
            // Assuming start_date is DATE, cast to text to filter by year prefix
            query += ` AND TO_CHAR(start_date, 'YYYY') = $${paramIdx++}`;
            params.push(filters.year);
        }
        if (filters.searchTerm) {
            query += ` AND (period_name ILIKE $${paramIdx} OR period_id ILIKE $${paramIdx})`;
            params.push(`%${filters.searchTerm}%`);
            paramIdx++;
        }

        query += ` ORDER BY start_date DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    },

    async findById(companyId, periodId) {
        const result = await pool.query(
            `SELECT * FROM financial_periods WHERE company_id = $1 AND period_id = $2`,
            [companyId, periodId]
        );
        return result.rows[0] || null;
    },

    async findOpenPeriodByDate(companyId, date) {
        // Check if the given date falls within an Open period
        const result = await pool.query(
            `SELECT * FROM financial_periods 
       WHERE company_id = $1 
         AND status = 'Open' 
         AND $2::DATE BETWEEN start_date AND end_date
       LIMIT 1`,
            [companyId, date]
        );
        return result.rows[0] || null;
    },

    async create(companyId, data) {
        const result = await pool.query(
            `INSERT INTO financial_periods (
         company_id, period_id, period_name, start_date, end_date, status, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
            [
                companyId,
                data.period_id,
                data.period_name,
                data.start_date, // 'YYYY-MM-DD'
                data.end_date,   // 'YYYY-MM-DD'
                data.status || 'Future',
            ]
        );
        return result.rows[0];
    },

    async update(companyId, periodId, data) {
        // Build dynamic update
        const fields = [];
        const params = [companyId, periodId];
        let idx = 3;

        if (data.status !== undefined) {
            fields.push(`status = $${idx++}`);
            params.push(data.status);
        }
        if (data.closing_date !== undefined) {
            fields.push(`closing_date = $${idx++}`);
            params.push(data.closing_date); // Can be null
        }
        if (data.closed_by !== undefined) {
            fields.push(`closed_by = $${idx++}`);
            params.push(data.closed_by); // Can be null
        }

        if (fields.length === 0) return null; // Nothing to update

        const result = await pool.query(
            `UPDATE financial_periods
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE company_id = $1 AND period_id = $2
       RETURNING *`,
            params
        );
        return result.rows[0] || null;
    },

    // Close all other open periods (helper for ensuring single open period)
    async closeOtherPeriods(companyId, exceptPeriodId, closedBy) {
        await pool.query(
            `UPDATE financial_periods
       SET status = 'Closed', closing_date = CURRENT_DATE, closed_by = $3, updated_at = NOW()
       WHERE company_id = $1 AND period_id != $2 AND status = 'Open'`,
            [companyId, exceptPeriodId, closedBy]
        );
    },

    // --- Fiscal Settings ---

    async getFiscalSettings(companyId) {
        const result = await pool.query(
            `SELECT * FROM fiscal_settings WHERE company_id = $1`,
            [companyId]
        );
        return result.rows[0] || null;
    },

    async upsertFiscalSettings(companyId, fiscalStartMonth) {
        const result = await pool.query(
            `INSERT INTO fiscal_settings (company_id, fiscal_year_start_month, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (company_id)
       DO UPDATE SET fiscal_year_start_month = EXCLUDED.fiscal_year_start_month, updated_at = NOW()
       RETURNING *`,
            [companyId, fiscalStartMonth]
        );
        return result.rows[0];
    },
};

export default FinancialPeriodModel;
