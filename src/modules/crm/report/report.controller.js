import ReportService from './report.service.js';

export const getFullReport = async (req, res) => {
  try {
    const { companyID } = req.auth; // assuming auth middleware attaches this
    const report = await ReportService.getReport(companyID);
    console.log(report);
    
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating report' });
  }
};
