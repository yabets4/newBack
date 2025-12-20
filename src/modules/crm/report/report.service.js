import ReportModel from './report.model.js';

const ReportService = {
  async getReport(companyId) {
    return await ReportModel.getFullReport(companyId);
  }
};

export default ReportService;
