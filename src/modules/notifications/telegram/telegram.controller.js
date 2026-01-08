import telegramService from './telegram.service.js';
import telegramModel from './telegram.model.js';
import automationService from './automation.service.js';
import pool from '../../../loaders/db.loader.js';

export const TelegramController = {
    async getSettings(req, res) {
        try {
            const companyId = req.auth.companyID;
            const settings = await telegramModel.getSettings(companyId);
            return res.status(200).json({ success: true, data: settings });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async updateSettings(req, res) {
        try {
            const companyId = req.auth.companyID;
            const settings = await telegramModel.upsertSettings(companyId, req.body);
            return res.status(200).json({ success: true, data: settings });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async sendTestMessage(req, res) {
        try {
            const companyId = req.auth.companyID;
            const { chatId, message } = req.body;

            if (!chatId || !message) {
                return res.status(400).json({ success: false, message: 'chatId and message are required' });
            }

            await telegramService.sendMessage(companyId, chatId, message);
            return res.status(200).json({ success: true, message: 'Test message sent' });
        } catch (error) {
            const status = error.message.includes('Telegram') || error.message.includes('Bot') ? 400 : 500;
            return res.status(status).json({ success: false, message: error.message });
        }
    },

    async getSubscribers(req, res) {
        try {
            const companyId = req.auth.companyID;
            const q = `SELECT * FROM telegram_subscribers WHERE company_id = $1`;
            const { rows } = await pool.query(q, [companyId]);
            return res.status(200).json({ success: true, data: rows });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async runAutomationManually(req, res) {
        try {
            const companyId = req.auth.companyID;
            await automationService.runAutomation(companyId);
            return res.status(200).json({ success: true, message: 'Automation rules executed' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

export default TelegramController;
