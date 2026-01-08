import pool from '../../../loaders/db.loader.js';
import { v4 as uuidv4 } from 'uuid';

export const CostingModel = {
    async createRule(companyId, data) {
        const {
            type, category, rate, unit, description, effective_start_date, effective_end_date, status
        } = data;
        const rule_id = `RULE-${uuidv4().slice(0, 8).toUpperCase()}`;

        const q = `
      INSERT INTO product_costing_rules (
        company_id, rule_id, type, category, rate, unit, description, 
        effective_start_date, effective_end_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

        const { rows } = await pool.query(q, [
            companyId, rule_id, type, category, rate, unit, description,
            effective_start_date, effective_end_date || null, status || 'Active'
        ]);
        return rows[0];
    },

    async findRules(companyId, filters = {}) {
        const { type, status } = filters;
        const clauses = ['company_id = $1'];
        const params = [companyId];
        let idx = 2;

        if (type) {
            clauses.push(`type = $${idx++}`);
            params.push(type);
        }
        if (status) {
            clauses.push(`status = $${idx++}`);
            params.push(status);
        }

        const q = `
      SELECT * FROM product_costing_rules 
      WHERE ${clauses.join(' AND ')}
      ORDER BY created_at DESC;
    `;

        const { rows } = await pool.query(q, params);
        return rows;
    },

    async findRuleById(companyId, ruleId) {
        const q = `SELECT * FROM product_costing_rules WHERE company_id = $1 AND rule_id = $2;`;
        const { rows } = await pool.query(q, [companyId, ruleId]);
        return rows[0];
    },

    async updateRule(companyId, ruleId, data) {
        const fields = [];
        const params = [companyId, ruleId];
        let idx = 3;

        const allowed = [
            'category', 'rate', 'unit', 'description',
            'effective_start_date', 'effective_end_date', 'status'
        ];

        for (const key of allowed) {
            if (data[key] !== undefined) {
                fields.push(`${key} = $${idx++}`);
                params.push(data[key]);
            }
        }

        if (fields.length === 0) return null;

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        const q = `
      UPDATE product_costing_rules 
      SET ${fields.join(', ')} 
      WHERE company_id = $1 AND rule_id = $2 
      RETURNING *;
    `;

        const { rows } = await pool.query(q, params);
        return rows[0];
    },

    async deleteRule(companyId, ruleId) {
        const q = `DELETE FROM product_costing_rules WHERE company_id = $1 AND rule_id = $2;`;
        const { rowCount } = await pool.query(q, [companyId, ruleId]);
        return rowCount > 0;
    }
};
