// telegramBot.js
import TelegramBot from "node-telegram-bot-api";
import { getCompanyTelegramToken } from "./tokenFetcher.js";

const bots = {}; // cache bot instances per company

// Get or create bot instance for the company (companyID handled internally)
async function getBot() {
  const token = await getCompanyTelegramToken(); // no params needed
  if (!token) throw new Error("Telegram token not found for company");

  // fetch companyId from token fetcher if needed for caching
  const companyId = token; // simple unique key (token is unique per company)
  if (!bots[companyId]) {
    bots[companyId] = new TelegramBot(token, { polling: true });
  }

  return bots[companyId];
}

// Send a message
export async function sendTelegramMessage(chatId, message, options = {}) {
  const bot = await getBot();
  return bot.sendMessage(chatId, message, options);
}

export async function onTelegramMessage(callback) {
  const bot = await getBot();
  bot.on("message", callback);
}
