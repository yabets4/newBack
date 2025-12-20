import CompanyModel from './dataMigration.model.js';
import { Parser as CsvParser } from 'json2csv';
import PDFDocument from 'pdfkit';

const model = new CompanyModel();

export default class CompanyService {
  // ... other methods

  static async exportCompanyData(company_name, format = 'csv') {
    // Fetch all relevant data for this company
    const companyData = await model.getCompanyByName(company_name);
    if (!companyData) throw new Error('Company not found');

    // Convert to CSV
    if (format === 'csv') {
      const parser = new CsvParser();
      return parser.parse(companyData);
    }

    // Convert to PDF
    if (format === 'pdf') {
      const doc = new PDFDocument();
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {});
      
      doc.fontSize(16).text(`Company Data: ${company_name}`, { underline: true });
      doc.moveDown();

      Object.entries(companyData).forEach(([key, value]) => {
        doc.fontSize(12).text(`${key}: ${value}`);
      });

      doc.end();
      return new Promise((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
      });
    }

    throw new Error('Invalid format');
  }
}
