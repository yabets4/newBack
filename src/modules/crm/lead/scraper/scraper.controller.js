import * as scraperService from "./scraper.service.js";

export class ScraperController {
  // Create new scrape (with AI enrichment)
  static async create(req, res) {
    try {
      const { url, dynamic } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required" });

      const scrape = await scraperService.createScrapeData(url, dynamic);
      res.json(scrape);
    } catch (err) {
      console.error("Scrape create error:", err.message);
      res.status(500).json({ error: "Failed to scrape and analyze" });
    }
  }

  // Get all scrapes
  static async getAll(req, res) {
    try {
      const scrapes = await scraperService.getScrapes();
      res.json(scrapes);
    } catch (err) {
      console.error("Scrape getAll error:", err.message);
      res.status(500).json({ error: "Failed to fetch scrapes" });
    }
  }

  // Get single scrape by ID
  static async getOne(req, res) {
    try {
      const { id } = req.params;
      const scrape = await scraperService.getScrapeById(id);
      if (!scrape) return res.status(404).json({ error: "Scrape not found" });
      res.json(scrape);
    } catch (err) {
      console.error("Scrape getOne error:", err.message);
      res.status(500).json({ error: "Failed to fetch scrape" });
    }
  }

  // Update scrape manually
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { url, content, ai_summary, emails, phones } = req.body;
      const updated = await scraperService.updateScrape(id, { url, content, ai_summary, emails, phones });
      res.json(updated);
    } catch (err) {
      console.error("Scrape update error:", err.message);
      res.status(500).json({ error: "Failed to update scrape" });
    }
  }

  // Delete scrape
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await scraperService.deleteScrape(id);
      res.json(deleted);
    } catch (err) {
      console.error("Scrape delete error:", err.message);
      res.status(500).json({ error: "Failed to delete scrape" });
    }
  }
}
