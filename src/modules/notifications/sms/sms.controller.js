import smsService from './sms.service.js';

class SMSController {
    /**
     * Send SMS - Queue message for custom app
     */
    async sendSMS(req, res) {
        try {
            const { recipients, message, template_id } = req.body;
            const companyId = req.auth.companyID;
            const userId = req.auth.user;

            // Validation
            if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Recipients array is required and cannot be empty'
                });
            }

            if (!message || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Message body is required'
                });
            }

            // Queue the message
            const result = await smsService.queueMessage(
                companyId,
                recipients,
                message,
                userId
            );

            return res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Error queuing SMS:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to queue SMS'
            });
        }
    }

    /**
     * Get message queue/history
     */
    async getMessages(req, res) {
        try {
            const companyId = req.auth.companyID;
            const { limit = 50, offset = 0 } = req.query;

            const messages = await smsService.getMessageHistory(
                companyId,
                parseInt(limit),
                parseInt(offset)
            );

            return res.status(200).json({
                success: true,
                messages
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch messages'
            });
        }
    }

    /**
     * Get message statistics
     */
    async getStats(req, res) {
        try {
            const companyId = req.auth.companyID;
            const stats = await smsService.getMessageStats(companyId);

            return res.status(200).json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics'
            });
        }
    }

    /**
     * Custom app listener endpoint - Get pending messages
     */
    async getQueue(req, res) {
        try {
            const { limit = 10 } = req.query;

            // TODO: Add API key authentication for custom app

            const messages = await smsService.getPendingMessages(parseInt(limit));

            return res.status(200).json({
                success: true,
                messages
            });
        } catch (error) {
            console.error('Error fetching queue:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch queue'
            });
        }
    }

    /**
     * Update message status (called by custom app)
     */
    async updateStatus(req, res) {
        try {
            const { message_id, status, error_message } = req.body;

            // TODO: Add API key authentication for custom app

            if (!message_id || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'message_id and status are required'
                });
            }

            const updated = await smsService.updateMessageStatus(
                message_id,
                status,
                error_message
            );

            return res.status(200).json({
                success: true,
                message: updated
            });
        } catch (error) {
            console.error('Error updating status:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to update status'
            });
        }
    }

    // --- Settings handlers ---

    async getSettings(req, res) {
        try {
            const companyId = req.auth.companyID;
            const settings = await smsService.getSettings(companyId);
            return res.status(200).json({
                success: true,
                data: settings || { company_id: companyId, listener_api_key: '', is_active: true }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateSettings(req, res) {
        try {
            const companyId = req.auth.companyID;
            const settings = await smsService.updateSettings(companyId, req.body);
            return res.status(200).json({ success: true, data: settings });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // --- Template handlers ---

    async getTemplates(req, res) {
        try {
            const companyId = req.auth.companyID;
            const templates = await smsService.getTemplates(companyId);
            return res.status(200).json({ success: true, data: templates });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async createTemplate(req, res) {
        try {
            const companyId = req.auth.companyID;
            const template = await smsService.createTemplate(companyId, req.body);
            return res.status(201).json({ success: true, data: template });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateTemplate(req, res) {
        try {
            const companyId = req.auth.companyID;
            const template = await smsService.updateTemplate(req.params.id, companyId, req.body);
            if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
            return res.status(200).json({ success: true, data: template });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteTemplate(req, res) {
        try {
            const companyId = req.auth.companyID;
            const deleted = await smsService.deleteTemplate(req.params.id, companyId);
            if (!deleted) return res.status(404).json({ success: false, message: 'Template not found' });
            return res.status(200).json({ success: true, message: 'Template deleted' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new SMSController();
