import { EmployeeModel } from './employee.model.js';

export default class EmployeeService {
  // ✅ List all employees (basic info)
  async getAllEmployees(companyId) {
    try {
      return await EmployeeModel.findAll(companyId);
    } catch (err) {
      console.error('Service error: getAllEmployees', err);
      throw new Error('Could not fetch employees');
    }
  }

  // ✅ Get one employee with all related data
  async getEmployeeById(companyId, employeeId) {
    try {
      const employee = await EmployeeModel.findById(companyId, employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }
      return employee;
    } catch (err) {
      console.error('Service error: getEmployeeById', err);
      throw err;
    }
  }

  // Get leave balances for an employee
  async getLeaveBalances(companyId, employeeId) {
    try {
      return await EmployeeModel.getLeaveBalances(companyId, employeeId);
    } catch (err) {
      console.error('Service error: getLeaveBalances', err);
      throw new Error('Could not fetch leave balances');
    }
  }

  // Upsert leave balances (admin)
  async setLeaveBalances(companyId, employeeId, balances) {
    try {
      await EmployeeModel.upsertLeaveBalances(companyId, employeeId, balances || []);
      return { success: true };
    } catch (err) {
      console.error('Service error: setLeaveBalances', err);
      throw new Error('Could not set leave balances');
    }
  }

  // ✅ Create new employee
  async createEmployee(companyId, data) {
    try {
      // Normalize employee_type
      if (data.employee_type) {
        data.employee_type = data.employee_type
          .toLowerCase()
          .replace(/\s+/g, '_')  // spaces → underscores
          .replace(/-/g, '_');   // hyphens → underscores
      }

      return await EmployeeModel.create(companyId, data);
    } catch (err) {
      console.error('Service error: createEmployee', err);
      throw new Error('Could not create employee');
    }
  }


  // ✅ Update employee (static + related tables)
  async updateEmployee(companyId, employeeId, data) {
    try {
      const updated = await EmployeeModel.update(companyId, employeeId, data);
      if (!updated) {
        throw new Error('Employee not found or update failed');
      }
      return updated;
    } catch (err) {
      console.error('Service error: updateEmployee', err);
      throw err;
    }
  }

  // ✅ Delete employee + related rows
  async deleteEmployee(companyId, employeeId) {
    try {
      const deleted = await EmployeeModel.remove(companyId, employeeId);
      if (!deleted) {
        throw new Error('Employee not found or could not delete');
      }
      return { success: true };
    } catch (err) {
      console.error('Service error: deleteEmployee', err);
      throw err;
    }
  }

  // Set employee status (active/inactive)
  async setEmployeeStatus(companyId, employeeId, status) {
    try {
      const updated = await EmployeeModel.updateStatus(companyId, employeeId, status);
      return updated;
    } catch (err) {
      console.error('Service error: setEmployeeStatus', err);
      throw new Error('Could not update employee status');
    }
  }

  async getInfo(companyId) {
    return await EmployeeModel.getInfo(companyId);
  }

  async promoteEmployee(companyId, employeeId) {
    try {
      return await EmployeeModel.promoteEmployee(companyId, employeeId);
    } catch (err) {
      console.error('Service error: promoteEmployee', err);
      throw err;
    }
  }
}
