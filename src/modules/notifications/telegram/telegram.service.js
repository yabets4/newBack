import TelegramBot from 'node-telegram-bot-api';
import telegramModel from './telegram.model.js';

const bots = {}; // cache bot instances per companyId

export const TelegramService = {
    /**
     * Get or initialize bot instance for a company
     */
    async getBotInstance(companyId) {
        if (bots[companyId]) return bots[companyId];

        const settings = await telegramModel.getSettings(companyId);
        if (!settings || !settings.bot_token || !settings.is_active) {
            return null;
        }

        try {
            const bot = new TelegramBot(settings.bot_token, { polling: true });

            // Basic error handling to prevent crash
            bot.on('polling_error', (error) => {
                console.error(`Telegram Polling Error [${companyId}]:`, error.message);
                // If it's a 401 or 404, the token is likely invalid
                if (error.message.includes('404') || error.message.includes('401')) {
                    console.warn(`Clearing invalid bot instance for company ${companyId}`);
                    if (bots[companyId]) {
                        bots[companyId].stopPolling();
                        delete bots[companyId];
                    }
                }
            });

            // Handle incoming messages/commands
            bot.on('message', async (msg) => {
                const chatId = msg.chat.id;
                const text = msg.text;
                if (!text) return;

                console.log(`Telegram Message [${companyId}] from ${chatId}: ${text}`);
                await this.handleBotCommand(companyId, chatId, text);
            });

            bots[companyId] = bot;
            return bot;
        } catch (error) {
            console.error(`Failed to initialize bot for company ${companyId}:`, error);
            return null;
        }
    },

    /**
     * Send message to a specific chat
     */
    async sendMessage(companyId, chatId, message, options = {}) {
        const bot = await this.getBotInstance(companyId);
        if (!bot) throw new Error('Telegram bot not configured or inactive for this company');

        try {
            return await bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                ...options
            });
        } catch (error) {
            // Handle specific Telegram errors
            if (error.message.includes('404') || error.message.includes('401')) {
                // Token is invalid
                if (bots[companyId]) {
                    bots[companyId].stopPolling();
                    delete bots[companyId];
                }
                throw new Error('Invalid Telegram Bot Token. Please check your settings.');
            }
            if (error.message.includes('403')) {
                throw new Error('Bot blocked by user or kicked from chat.');
            }
            if (error.message.includes('400')) {
                throw new Error(`Telegram error: ${error.message} (Is the Chat ID correct?)`);
            }
            throw error;
        }
    },

    /**
     * Send message to a resolved subscriber
     */
    async sendToSubscriber(companyId, type, externalId, message) {
        const subscriber = await telegramModel.getSubscriber(companyId, type, externalId);

        let chatId = null;
        if (subscriber) {
            chatId = subscriber.chat_id;
        } else if (type === 'Owner') {
            const settings = await telegramModel.getSettings(companyId);
            chatId = settings?.owner_chat_id;
        }

        if (!chatId) {
            console.warn(`No Telegram Chat ID found for ${type}:${externalId}`);
            return null;
        }

        return this.sendMessage(companyId, chatId, message);
    },

    /**
     * Register a new subscriber (usually called via bot command /start)
     */
    async handleBotCommand(companyId, chatId, text) {
        // e.g., /register EMP-01
        if (text.startsWith('/register')) {
            const parts = text.split(' ');
            if (parts.length < 2) {
                return this.sendMessage(companyId, chatId, "Please provide your ID. Format: /register EMP-01");
            }

            const externalId = parts[1];
            // Infer type from prefix for now
            let type = 'Employee';
            if (externalId.startsWith('CUS')) type = 'Customer';
            if (externalId.startsWith('LEAD')) type = 'Lead';

            await telegramModel.upsertSubscriber(companyId, {
                subscriber_type: type,
                external_id: externalId,
                chat_id: chatId.toString()
            });

            return this.sendMessage(companyId, chatId, `Successfully registered as ${type} (${externalId})!`);
        }

        if (text.startsWith('/myid')) {
            return this.sendMessage(companyId, chatId, `Your Chat ID is: <code>${chatId}</code>`);
        }
    }
};

export default TelegramService;
