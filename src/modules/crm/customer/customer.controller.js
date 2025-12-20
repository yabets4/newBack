import { CustomersService } from "./customer.service.js";
import { ok, badRequest, notFound } from "../../../utils/apiResponse.js";
import { getCompanyNameById } from "../../../middleware/services/company.service.js";

// GET all customers
export async function getCustomers(req, res) {
  try {
    const { companyID } = req.auth;
    const customers = await CustomersService.list(companyID);
    return ok(res, customers);
  } catch (err) {
    return badRequest(res, err.message);
  }
}

// GET single customer by customer_id (CUS-XX)
export async function getCustomer(req, res) {
  try {
    const { companyID } = req.auth;
    const { id: customerId } = req.params; // rename for clarity
    const customer = await CustomersService.get(companyID, customerId);
    if (!customer) return notFound(res, "Customer not found");
    return ok(res, customer);
  } catch (err) {
    return badRequest(res, err.message);
  }
}

// CREATE new customer
export async function createCustomer(req, res) {
  try {
    const { companyID } = req.auth;

    let customerData = { ...req.body };

    if (req.file) {
        // Derive the returned uploads URL from multer's saved path so it matches the static /uploads route
        const relativePath = req.file.path.split('uploads')[1].replace(/\\/g, '/');
        customerData.photo_url = `/uploads${relativePath}`;
    }

    const newCustomer = await CustomersService.create(companyID, customerData);
    return ok(res, newCustomer);
  } catch (err) {
    return badRequest(res, err.message);
  }
}

// UPDATE customer by customer_id
export async function updateCustomer(req, res) {
  try {
    const { companyID } = req.auth;
    const { id: customerId } = req.params;

    let customerData = { ...req.body };

    if (req.file) {
      const relativePath = req.file.path.split('uploads')[1].replace(/\\/g, '/');
      customerData.photo_url = `/uploads${relativePath}`;
    }

    const updated = await CustomersService.update(companyID, customerId, customerData);
    if (!updated) return notFound(res, "Customer not found");
    return ok(res, updated);
  } catch (err) {
    return badRequest(res, err.message);
  }
}

// DELETE customer by customer_id
export async function deleteCustomer(req, res) {
  try {
    const { companyID } = req.auth;
    const { id: customerId } = req.params;
    const deleted = await CustomersService.delete(companyID, customerId);
    if (!deleted) return notFound(res, "Customer not found");
    return ok(res, { message: "Customer deleted" });
  } catch (err) {
    return badRequest(res, err.message);
  }
}

// Convert a lead to a customer
export async function convertLeadToCustomer(req, res) {
  try {
    const { companyID } = req.auth;
    const { leadId } = req.params;
    const newCustomer = await CustomersService.convertLeadToCustomer(companyID, leadId);
    return ok(res, newCustomer);
  } catch (err) {
    if (err.code === "ALREADY_EXISTS") {
      const suffix = err.matchedOn ? ` via ${err.matchedOn}` : '';
      return badRequest(res, `Customer already exists: ${err.existingCustomerId}${suffix}`);
    }
    return badRequest(res, err.message);
  }
}
