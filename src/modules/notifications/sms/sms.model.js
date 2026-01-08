import pool from '../../../loaders/db.loader.js';

class SMSModel {
    /**
     * Create a new SMS message in queue
     */
    async createMessage(companyId, messageId, recipients, messageBody, createdBy) {
        const query = `
            INSERT INTO sms_queue (company_id, message_id, recipients, message_body, created_by, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *
        `;

        const result = await pool.query(query, [
            companyId,
            messageId,
            JSON.stringify(recipients),
            messageBody,
            createdBy
        ]);

        return result.rows[0];
    }

    /**
     * Get pending messages for custom app listener
     */
    async getPendingMessages(limit = 10) {
        const query = `
            SELECT 
                message_id,
                company_id,
                recipients,
                message_body,
                created_at
            FROM sms_queue
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT $1
        `;

        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    /**
     * Update message status
     */
    async updateMessageStatus(messageId, status, errorMessage = null) {
        const timestampField = status === 'sent_to_app' ? 'sent_at' : status === 'delivered' ? 'delivered_at' : null;

        let query = `
            UPDATE sms_queue
            SET status = $1, error_message = $2
        `;

        if (timestampField) {
            query += `, ${timestampField} = NOW()`;
        }

        query += ` WHERE message_id = $3 RETURNING *`;

        const result = await pool.query(query, [status, errorMessage, messageId]);
        return result.rows[0];
    }

    /**
     * Get message by ID
     */
    async getMessageById(messageId) {
        const query = `SELECT * FROM sms_queue WHERE message_id = $1`;
        const result = await pool.query(query, [messageId]);
        return result.rows[0];
    }

    /**
     * Get messages by company (with pagination)
     */
    async getMessagesByCompany(companyId, limit = 50, offset = 0) {
        const query = `
            SELECT *
            FROM sms_queue
            WHERE company_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(query, [companyId, limit, offset]);
        return result.rows;
    }

    /**
     * Get message statistics for a company
     */
    async getMessageStats(companyId) {
        const query = `
            SELECT 
                status,
                COUNT(*) as count
            FROM sms_queue
            WHERE company_id = $1
            GROUP BY status
        `;

        const result = await pool.query(query, [companyId]);
        return result.rows;
    }

    // --- Settings ---

    async getSettings(companyId) {
        const query = `SELECT * FROM sms_settings WHERE company_id = $1`;
        const result = await pool.query(query, [companyId]);
        return result.rows[0];
    }

    async updateSettings(companyId, data) {
        const { listener_api_key, is_active } = data;
        const query = `
            INSERT INTO sms_settings (company_id, listener_api_key, is_active, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (company_id) DO UPDATE
            SET listener_api_key = EXCLUDED.listener_api_key,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
            RETURNING *
        `;
        const result = await pool.query(query, [companyId, listener_api_key, is_active]);
        return result.rows[0];
    }

    async verifyApiKey(apiKey) {
        const query = `SELECT company_id FROM sms_settings WHERE listener_api_key = $1 AND is_active = TRUE`;
        const result = await pool.query(query, [apiKey]);
        return result.rows[0];
    }

    // --- Templates ---

    async getTemplates(companyId) {
        const query = `SELECT * FROM sms_templates WHERE company_id = $1 ORDER BY created_at DESC`;
        const result = await pool.query(query, [companyId]);
        return result.rows;
    }

    async getTemplateById(id, companyId) {
        const query = `SELECT * FROM sms_templates WHERE id = $1 AND company_id = $2`;
        const result = await pool.query(query, [id, companyId]);
        return result.rows[0];
    }

    async createTemplate(companyId, name, content, variables) {
        const query = `
            INSERT INTO sms_templates (company_id, name, content, variables)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [companyId, name, content, JSON.stringify(variables)]);
        return result.rows[0];
    }

    async updateTemplate(id, companyId, name, content, variables) {
        const query = `
            UPDATE sms_templates
            SET name = $1, content = $2, variables = $3, updated_at = NOW()
            WHERE id = $4 AND company_id = $5
            RETURNING *
        `;
        const result = await pool.query(query, [name, content, JSON.stringify(variables), id, companyId]);
        return result.rows[0];
    }

    async deleteTemplate(id, companyId) {
        const query = `DELETE FROM sms_templates WHERE id = $1 AND company_id = $2 RETURNING *`;
        const result = await pool.query(query, [id, companyId]);
        return result.rows[0];
    }
}

export default new SMSModel();
