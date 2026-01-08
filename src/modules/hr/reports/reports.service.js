import ReportsModel from './reports.model.js';

const ReportsService = {
  async dashboard(companyId) {
    // Return categories with report entries so frontend can render links
    return [
      {
        id: 'employees',
        name: 'Employee Reports',
        description: 'Reports about employees, demographics and tenure',
        reports: [
          { id: 'employee_demographics', name: 'Employee Demographics', description: 'Breakdown by age, gender, nationality, marital status.', link: '/hr/reports/employee_demographics' },
          { id: 'employee_status', name: 'Employee Status & Headcount', description: 'Active, inactive, on leave counts; total headcount.', link: '/hr/reports/employee_status' },
          { id: 'employee_tenure', name: 'Employee Tenure Analysis', description: 'Average tenure, employees by years of service.', link: '/hr/reports/employee_tenure' },
          { id: 'department_breakdown', name: 'Departmental Breakdown', description: 'Employee distribution across departments.', link: '/hr/reports/department_breakdown' },
        ]
      },
      {
        id: 'performance',
        name: 'Performance Reports',
        description: 'Insights into employee performance and reviews',
        reports: [
          { id: 'review_completion_rates', name: 'Review Completion Rates', description: 'Track progress of performance review cycles.', link: '/hr/reports/review_completion_rates' },
          { id: 'average_ratings', name: 'Average Performance Ratings', description: 'Average ratings by department, job title, or overall.', link: '/hr/reports/average_ratings' },
          { id: 'feedback_trends', name: 'Feedback Trends', description: 'Analysis of positive vs. constructive feedback over time.', link: '/hr/reports/feedback_trends' },
        ]
      },
      {
        id: 'attendance',
        name: 'Attendance Reports',
        description: 'Reports on attendance, punctuality, and absences',
        reports: [
          { id: 'daily_attendance_summary', name: 'Daily Attendance Summary', description: 'Overview of daily clock-ins/outs, late arrivals, absences.', link: '/hr/reports/daily_attendance_summary' },
          { id: 'absence_rate', name: 'Absence Rate Analysis', description: 'Track absenteeism by employee, department, or reason.', link: '/hr/reports/absence_rate' },
          { id: 'overtime_summary', name: 'Overtime Summary', description: 'Total overtime hours by employee or department.', link: '/hr/reports/overtime_summary' },
        ]
      },
      {
        id: 'payroll',
        name: 'Payroll Reports',
        description: 'Financial reports related to compensation and deductions',
        reports: [
          { id: 'payroll_summary', name: 'Payroll Summary by Period', description: 'Total gross, net, and deductions for a given pay period.', link: '/hr/reports/payroll_summary' },
          { id: 'tax_deduction_summary', name: 'Tax & Deduction Summary', description: 'Breakdown of taxes and other deductions.', link: '/hr/reports/tax_deduction_summary' },
          { id: 'compensation_breakdown', name: 'Compensation Breakdown', description: 'Analysis of base salary, bonuses, and allowances.', link: '/hr/reports/compensation_breakdown' },
        ]
      },
      {
        id: 'leave-request',
        name: 'Leave Reports',
        description: 'Reports on leave utilization and balances',
        reports: [
          { id: 'leave_balance_summary', name: 'Leave Balance Summary', description: 'Current leave balances for all employees.', link: '/hr/reports/leave_balance_summary' },
          { id: 'leave_utilization', name: 'Leave Utilization by Type', description: 'How much of each leave type is being used.', link: '/hr/reports/leave_utilization' },
          { id: 'upcoming_leaves', name: 'Upcoming Leaves Overview', description: 'List of all approved upcoming leaves.', link: '/hr/reports/upcoming_leaves' },
        ]
      }
    ];
  },

  async getReport(companyId, reportId, filters = {}) {
    // For employee-related reports, fetch employee list and map to expected shape
    const employeeReports = ['employee_demographics', 'employee_status', 'employee_tenure', 'department_breakdown'];
    if (employeeReports.includes(reportId)) {
      const rows = await ReportsModel.listEmployees(companyId, filters);
      // map rows to the frontend mock shape
      const mapped = rows.map(r => {
        const hireYear = r.hire_date ? new Date(r.hire_date).getFullYear() : (r.created_at ? new Date(r.created_at).getFullYear() : null);
        let ageGroup = null;
        if (r.date_of_birth) {
          const age = new Date().getFullYear() - new Date(r.date_of_birth).getFullYear();
          if (age < 25) ageGroup = '20-24';
          else if (age < 35) ageGroup = '25-34';
          else if (age < 45) ageGroup = '35-44';
          else ageGroup = '45+';
        }
        return {
          id: r.employee_id,
          name: r.name,
          department: r.department || 'Unknown',
          status: 'Active',
          hireYear,
          gender: r.gender || 'Unknown',
          ageGroup,
        };
      });
      // build chart summaries
      const genderData = {};
      const departmentData = {};
      const tenureData = {};

      mapped.forEach(item => {
        if (item.gender) genderData[item.gender] = (genderData[item.gender] || 0) + 1;
        if (item.department) departmentData[item.department] = (departmentData[item.department] || 0) + 1;
        const tenureKey = item.hireYear ? `${new Date().getFullYear() - item.hireYear} years` : 'Unknown';
        tenureData[tenureKey] = (tenureData[tenureKey] || 0) + 1;
      });

      const charts = {
        genderDistribution: Object.keys(genderData).map(k => ({ name: k, value: genderData[k] })),
        departmentBreakdown: Object.keys(departmentData).map(k => ({ name: k, value: departmentData[k] })),
        tenureAnalysis: Object.keys(tenureData).map(k => ({ name: k, count: tenureData[k] })),
      };

      return { data: mapped, charts };
    }

    // For other report types, return an empty dataset for now
    return { data: [] };
  }
};

export default ReportsService;
