import pool from '../../../loaders/db.loader.js';
import smsModel from './sms.model.js';
import { v4 as uuidv4 } from 'uuid';

class SMSService {
    /**
     * Resolve recipients (customer IDs, lead IDs) to phone numbers
     */
    async resolveRecipients(recipients, companyId) {
        const phoneNumbers = [];

        for (const recipient of recipients) {
            // If already a phone number (starts with +)
            if (recipient.startsWith('+')) {
                phoneNumbers.push(recipient);
                continue;
            }

            // Try to resolve from customers
            if (recipient.startsWith('CUS-')) {
                const customerQuery = await pool.query(
                    `SELECT phone FROM customer_profiles WHERE customer_id = $1 AND company_id = $2`,
                    [recipient, companyId]
                );

                if (customerQuery.rows.length > 0 && customerQuery.rows[0].phone) {
                    phoneNumbers.push(customerQuery.rows[0].phone);
                }
            }

            // Try to resolve from leads
            else if (recipient.startsWith('LEAD-')) {
                const leadQuery = await pool.query(
                    `SELECT primary_phone FROM leads WHERE lead_id = $1 AND company_id = $2`,
                    [recipient, companyId]
                );

                if (leadQuery.rows.length > 0 && leadQuery.rows[0].primary_phone) {
                    phoneNumbers.push(leadQuery.rows[0].primary_phone);
                }
            }

            // Try to resolve from employees
            else if (recipient.startsWith('EMP-')) {
                const employeeQuery = await pool.query(
                    `SELECT phone_number FROM employees WHERE employee_id = $1 AND company_id = $2`,
                    [recipient, companyId]
                );

                if (employeeQuery.rows.length > 0 && employeeQuery.rows[0].phone_number) {
                    phoneNumbers.push(employeeQuery.rows[0].phone_number);
                }
            }
        }

        // Remove duplicates
        return [...new Set(phoneNumbers)];
    }

    /**
     * Queue SMS message
     */
    async queueMessage(companyId, recipients, messageBody, createdBy) {
        // Resolve recipients to phone numbers
        const phoneNumbers = await this.resolveRecipients(recipients, companyId);

        if (phoneNumbers.length === 0) {
            throw new Error('No valid phone numbers found for recipients');
        }

        // Generate unique message ID
        const messageId = `MSG-${Date.now()}-${uuidv4().substring(0, 8)}`;

        // Create message in queue
        const message = await smsModel.createMessage(
            companyId,
            messageId,
            phoneNumbers,
            messageBody,
            createdBy
        );

        return {
            message_id: messageId,
            recipients_count: phoneNumbers.length,
            queued_at: message.created_at,
            status: message.status
        };
    }

    /**
     * Get pending messages for custom app listener
     */
    async getPendingMessages(limit = 10) {
        return await smsModel.getPendingMessages(limit);
    }

    /**
     * Update message status (called by custom app)
     */
    async updateMessageStatus(messageId, status, errorMessage = null) {
        const validStatuses = ['pending', 'sent_to_app', 'delivered', 'failed'];

        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }

        return await smsModel.updateMessageStatus(messageId, status, errorMessage);
    }

    /**
     * Get message history for company
     */
    async getMessageHistory(companyId, limit = 50, offset = 0) {
        return await smsModel.getMessagesByCompany(companyId, limit, offset);
    }

    /**
     * Get message statistics
     */
    async getMessageStats(companyId) {
        return await smsModel.getMessageStats(companyId);
    }

    // --- Settings ---

    async getSettings(companyId) {
        return await smsModel.getSettings(companyId);
    }

    async updateSettings(companyId, data) {
        return await smsModel.updateSettings(companyId, data);
    }

    async verifyApiKey(apiKey) {
        return await smsModel.verifyApiKey(apiKey);
    }

    // --- Templates ---

    async getTemplates(companyId) {
        return await smsModel.getTemplates(companyId);
    }

    async createTemplate(companyId, data) {
        const { name, content, variables = [] } = data;
        return await smsModel.createTemplate(companyId, name, content, variables);
    }

    async updateTemplate(id, companyId, data) {
        const { name, content, variables = [] } = data;
        return await smsModel.updateTemplate(id, companyId, name, content, variables);
    }

    async deleteTemplate(id, companyId) {
        return await smsModel.deleteTemplate(id, companyId);
    }

    // --- Public Listener Logic ---

    async getPendingMessagesByApiKey(apiKey, limit = 10) {
        const settings = await this.verifyApiKey(apiKey);
        if (!settings) throw new Error('Invalid or inactive API Key');

        return await smsModel.getPendingMessages(limit);
    }

    async updateMessageStatusByApiKey(apiKey, messageId, status, errorMessage = null) {
        const settings = await this.verifyApiKey(apiKey);
        if (!settings) throw new Error('Invalid or inactive API Key');

        return await smsModel.updateMessageStatus(messageId, status, errorMessage);
    }
}

export default new SMSService();
