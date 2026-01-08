import pool from '../../../loaders/db.loader.js';

export const TelegramModel = {
    // --- Settings ---
    async getSettings(companyId) {
        const q = `SELECT * FROM telegram_settings WHERE company_id = $1`;
        const { rows } = await pool.query(q, [companyId]);
        return rows[0];
    },

    async upsertSettings(companyId, data) {
        const q = `
            INSERT INTO telegram_settings (company_id, bot_token, bot_username, is_active, owner_chat_id, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (company_id) 
            DO UPDATE SET 
                bot_token = EXCLUDED.bot_token,
                bot_username = EXCLUDED.bot_username,
                is_active = EXCLUDED.is_active,
                owner_chat_id = EXCLUDED.owner_chat_id,
                updated_at = NOW()
            RETURNING *;
        `;
        const { rows } = await pool.query(q, [
            companyId,
            data.bot_token,
            data.bot_username,
            data.is_active !== undefined ? data.is_active : true,
            data.owner_chat_id
        ]);
        return rows[0];
    },

    // --- Subscribers ---
    async getSubscriber(companyId, type, externalId) {
        const q = `SELECT * FROM telegram_subscribers WHERE company_id = $1 AND subscriber_type = $2 AND external_id = $3 AND is_active = TRUE`;
        const { rows } = await pool.query(q, [companyId, type, externalId]);
        return rows[0];
    },

    async getSubscriberByChatId(companyId, chatId) {
        const q = `SELECT * FROM telegram_subscribers WHERE company_id = $1 AND chat_id = $2`;
        const { rows } = await pool.query(q, [companyId, chatId]);
        return rows[0];
    },

    async upsertSubscriber(companyId, data) {
        const q = `
            INSERT INTO telegram_subscribers (company_id, subscriber_type, external_id, chat_id, is_active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (company_id, subscriber_type, external_id) 
            DO UPDATE SET 
                chat_id = EXCLUDED.chat_id,
                is_active = EXCLUDED.is_active
            RETURNING *;
        `;
        const { rows } = await pool.query(q, [
            companyId,
            data.subscriber_type,
            data.external_id,
            data.chat_id,
            data.is_active !== undefined ? data.is_active : true
        ]);
        return rows[0];
    },

    // --- Automation Rules ---
    async getAutomationRules(companyId) {
        const q = `SELECT * FROM telegram_automation_rules WHERE company_id = $1 AND is_active = TRUE`;
        const { rows } = await pool.query(q, [companyId]);
        return rows;
    },

    async upsertAutomationRule(companyId, data) {
        const q = `
            INSERT INTO telegram_automation_rules (company_id, rule_type, threshold, target_subscriber_type, is_active, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (id) DO UPDATE SET
                threshold = EXCLUDED.threshold,
                target_subscriber_type = EXCLUDED.target_subscriber_type,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
            RETURNING *;
        `;
        // Note: For rules it might be better to have unique (company_id, rule_type) if we only allow one per type
        // For now, simple insert/update by ID if provided.
        const { rows } = await pool.query(q, [
            companyId,
            data.rule_type,
            data.threshold,
            data.target_subscriber_type || 'Owner',
            data.is_active !== undefined ? data.is_active : true
        ]);
        return rows[0];
    }
};

export default TelegramModel;
