import CompanyService from './dataMigration.service.js';
import { ok, created, noContent, notFound } from '../../../utils/apiResponse.js';

export default class DataMigration {
  // CREATE, GET, etc...

  // --- Data migration / export ---
  static async exportCompanyData(req, res, next) {
    try {
      const { company_name, format } = req.body; // format: 'csv' or 'pdf'
      if (!company_name) return res.status(400).json({ error: 'company_name is required' });

      const fileBuffer = await CompanyService.exportCompanyData(company_name, format);
      
      // Set headers for download
      const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';
      const fileExt = format === 'pdf' ? 'pdf' : 'csv';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${company_name}.${fileExt}"`);
      res.send(fileBuffer);

    } catch (e) {
      next(e);
    }
  }
}
