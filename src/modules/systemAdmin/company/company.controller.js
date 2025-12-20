import CompanyService from './company.service.js';

export default class Controller {
  // CREATE
  static async onboard(req, res) {
    try {
      const files = req.files || {};
      const formData = {
        ...req.body,
        company_logo: files.companyLogo ? files.companyLogo[0].path : null,
        tin_document: files.tinDocument ? files.tinDocument[0].path : null,
        business_license: files.businessLicense ? files.businessLicense[0].path : null,
        trade_license: files.tradeLicense ? files.tradeLicense[0].path : null,
      };
      const result = await CompanyService.onboardCompany(formData);
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message || 'Failed to onboard company');
    }
  }

  // READ ALL
  static async getAll(req, res) {
    try {
      const companies = await CompanyService.getAllCompanies();
      res.status(200).json(companies);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message || 'Failed to fetch companies');
    }
  }

  // READ ONE
  static async getOne(req, res) {
    try {
      const company = await CompanyService.getCompanyById(req.params.company_id);
      res.status(200).json(company);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message || 'Failed to fetch company');
    }
  }

  // UPDATE
  static async update(req, res) {
    try {
      const files = req.files || {};
      const formData = {
        ...req.body,
        company_logo: files.companyLogo ? files.companyLogo[0].path : undefined,
        tin_document: files.tinDocument ? files.tinDocument[0].path : undefined,
        business_license: files.businessLicense ? files.businessLicense[0].path : undefined,
        trade_license: files.tradeLicense ? files.tradeLicense[0].path : undefined,
      };
      const updated = await CompanyService.updateCompany(req.params.company_id, formData);
      res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message || 'Failed to update company');
    }
  }

  // DELETE
  static async delete(req, res) {
    try {
      await CompanyService.deleteCompany(req.params.company_id);
      res.status(200).json({ message: 'Company deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message || 'Failed to delete company');
    }
  }
}
