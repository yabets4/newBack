import { saveCompanyLogo, getCompanyLogo } from './main.service.js';

export default class MainController {

  // ===============================
  // Fetch company logo
  // ===============================
  static async getCompanyLogoByName(req, res) {
    try {
      const { companyName } = req.body || {};
      if (!companyName) return res.status(400).json({ error: 'Company name is required' });

      const logo = await getCompanyLogo(companyName);
      if (!logo) return res.status(404).json({ error: 'Logo not found' });

      return res.json({ logo });
    } catch (err) {
      console.error('Error fetching company logo:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ===============================
  // Save or update company logo
  // ===============================
  static async update(req, res) {
    try {
      const { companyName, logoUrl } = req.body || {};
      if (!companyName || !logoUrl) {
        return res.status(400).json({ error: 'Company name and logo URL are required' });
      }

      const updated = await saveCompanyLogo(companyName, logoUrl);
      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('Error saving/updating company logo:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
