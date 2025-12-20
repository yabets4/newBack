import CompanyProfileModel from './companyProfile.model.js';

const model = new CompanyProfileModel();

export default {
  listCompanies: (opts) => model.findCompanies(opts),
  getCompany: (id) => model.findCompanyById(id),
  createCompany: (data) => model.createCompany(data),
  updateCompany: (id, data) => model.updateCompany(id, data),
  deleteCompany: (id) => model.deleteCompany(id),

  // --- Status ---
  activateCompany: (id) => model.activate(id),
  suspendCompany: (id) => model.suspend(id),
  deactivateCompany: (id) => model.deactivate(id),
  setTrialCompany: (id) => model.trial(id),
};
