import cheerio from "cheerio";
import puppeteer from "puppeteer";
import { query } from "../../../../utils/ai.utils.js";
import { createScrape, getScrapes, getScrapeById, updateScrape, deleteScrape } from "./scraper.model.js";

// Scrape static pages
async function scrapeStatic(url) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  return $("body").text();
}

// Scrape dynamic pages
async function scrapeDynamic(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  const content = await page.evaluate(() => document.body.innerText);
  await browser.close();
  return content;
}

// AI analyze scraped content
async function analyzeContent(content, url) {
  const data = {
    messages: [
      {
        role: "user",
        content: `
          Analyze the following content scraped from ${url} and summarize main topics:
          ${content}

          Return JSON like:
          {
            "summary": "...",
            "emails_found": ["..."],
            "phone_numbers_found": ["..."]
          }
        `,
      },
    ],
    model: "openai/gpt-oss-120b",
  };

  const result = await query(data);
  try {
    return JSON.parse(result.choices[0].message.content);
  } catch {
    return { summary: "", emails_found: [], phone_numbers_found: [] };
  }
}

// Full scrape + AI analysis
export async function createScrapeData(url, dynamic = false) {
  const content = dynamic ? await scrapeDynamic(url) : await scrapeStatic(url);
  const aiResult = await analyzeContent(content, url);

  return await createScrape({
    url,
    content,
    ai_summary: aiResult.summary,
    emails: aiResult.emails_found.join(", "),
    phones: aiResult.phone_numbers_found.join(", "),
  });
}

export { getScrapes, getScrapeById, updateScrape, deleteScrape };
