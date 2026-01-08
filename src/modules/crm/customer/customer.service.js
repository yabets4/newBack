// src/modules/systemAdmin/customers/customers.service.js
import { CustomersModel } from "./customer.model.js";
import { LeadsModel } from "../lead/lead.model.js";
import pool from '../../../loaders/db.loader.js';
import { ensureEmailNotRegistered } from '../emailChecker.js';

export const CustomersService = {
  // List all customers for a company
  async list(companyId) {
    console.log("[Service] Listing customers for company:", companyId);
    return await CustomersModel.findAll(companyId);
  },

  // Get single customer by customer_id
  async get(companyId, customerId) {
    console.log("[Service] Fetching customer:", customerId, "for company:", companyId);
    return await CustomersModel.findById(companyId, customerId);
  },

  // Create new customer (customer_id generated inside model)
  async create(companyId, data) {
    console.log("[Service] Creating customer for company:", companyId);
    console.log("[Service] Input data:", data);

    const isCompany = data.customer_type === "Company";

    // Always required: name and billing_address
    const requiredFields = ["name", "billing_address"];
    // If company, contact_name & contact_phone are required
    if (isCompany) requiredFields.push("contact_name", "contact_phone");

    const missingFields = requiredFields.filter(f => !data[f]);
    if (missingFields.length) {
      console.error("[Service] Missing required fields:", missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    try {
      // Prevent creation if email already exists in customers or leads
      if (data.email) await ensureEmailNotRegistered(companyId, data.email);
      const newCustomer = await CustomersModel.insert(companyId, data);
      console.log("[Service] Customer created successfully:", newCustomer.customer_id);
      return newCustomer;
    } catch (err) {
      console.error("[Service] Error creating customer:", err);
      throw err;
    }
  },

  // Update customer by customer_id
  async update(companyId, customerId, data) {
    console.log("[Service] Updating customer:", customerId, "for company:", companyId);
    console.log("[Service] Raw update data:", data);

    if (!data || Object.keys(data).length === 0) {
      console.warn("[Service] No data provided to update for customer:", customerId);
      return null; // nothing to update
    }

    // Flatten payload and ensure NOT NULL fields are set
    const payloadForModel = {
      name: data.name || "Unnamed",
      email: data.email || null,
      phone: data.phone || null,
      tin_number: data.tin_number || null,
      billing_address: data.billing_address || "No billing address provided", // NOT NULL fallback
      shipping_address: data.shipping_address || "", // can be empty
      gender: data.gender || null,
      birthday: data.birthday || null,
      contact_name: data.contact_name || null,
      contact_phone: data.contact_phone || null,
      job_title: data.job_title || null,
      photo_url: data.photo_url || null,
      customer_type: data.customer_type || "Individual",
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    };

    console.log("[Service] Flattened payload for model:", payloadForModel);

    try {
      const updatedCustomer = await CustomersModel.update(companyId, customerId, payloadForModel);
      console.log("[Service] Customer updated successfully:", updatedCustomer?.customer_id);
      return updatedCustomer;
    } catch (err) {
      console.error("[Service] Error updating customer:", err);
      throw err;
    }
  },


  // Delete customer by customer_id
  async delete(companyId, customerId) {
    console.log("[Service] Deleting customer:", customerId, "for company:", companyId);

    try {
      const deletedCustomer = await CustomersModel.remove(companyId, customerId);
      if (!deletedCustomer) {
        console.warn("[Service] Customer not found for deletion:", customerId);
        return null;
      }
      console.log("[Service] Customer deleted successfully:", customerId);
      return deletedCustomer;
    } catch (err) {
      console.error("[Service] Error deleting customer:", err);
      throw err;
    }
  },
  // Convert a lead into a customer
  async convertLeadToCustomer(companyId, leadId) {
    if (!companyId || !leadId) throw new Error("companyId and leadId are required");
    console.log("[Service] Converting lead to customer:", leadId, "for company:", companyId);

    // Fetch lead
    const lead = await LeadsModel.findById(companyId, leadId);
    if (!lead) throw new Error("Lead not found");
    // Detailed debug logging: show the lead fetched and normalized comparison values
    try {
      console.log('[Service][convert] Lead fetched:', JSON.stringify(lead));
    } catch (e) {
      console.log('[Service][convert] Lead fetched (toString):', String(lead));
    }
    const debugEmail = lead.email || null;
    const debugPhone = lead.primary_phone || lead.contact_person_number || null;
    console.log('[Service][convert] Checking existing customer with params:', { companyId, email: debugEmail, phone: debugPhone });

    // Check if a customer already exists with same email or phone
    // Use case-insensitive email match and digit-only phone comparison for robustness
    const existingRes = await pool.query(
      `SELECT c.customer_id,
          CASE
            WHEN lower(cp.email) = lower($2) AND $2 IS NOT NULL THEN 'email'
            WHEN regexp_replace(cp.phone, '\\D','','g') = regexp_replace($3, '\\D','','g') AND $3 IS NOT NULL THEN 'phone'
            ELSE 'unknown'
          END AS matched_on
       FROM customer_profiles cp
       JOIN customers c ON c.company_id = cp.company_id AND c.customer_id = cp.customer_id
       WHERE cp.company_id = $1
         AND (
           (lower(cp.email) = lower($2) AND $2 IS NOT NULL)
           OR (regexp_replace(cp.phone, '\\D','','g') = regexp_replace($3, '\\D','','g') AND $3 IS NOT NULL)
         )
       LIMIT 1`,
      [companyId, lead.email || null, lead.primary_phone || null]
    );

    console.log('[Service][convert] existingRes.rows:', JSON.stringify(existingRes.rows));

    if (existingRes.rows.length > 0) {
      const row = existingRes.rows[0];
      const existingCustomerId = row.customer_id;
      const matchedOn = row.matched_on || 'unknown';
      const err = new Error(`Customer already exists (${matchedOn})`);
      err.code = "ALREADY_EXISTS";
      err.existingCustomerId = existingCustomerId;
      err.matchedOn = matchedOn;
      // include found row for debugging if needed
      err.foundRow = row;
      console.error('[Service][convert] Aborting convert - existing customer found:', JSON.stringify(row));
      throw err;
    }

    // Map lead -> customer profile payload
    const profilePayload = {
      customer_type: lead.lead_type === "Company" ? "Company" : "Individual",
      name: lead.name || "Unnamed",
      contact_name: lead.contact_person_name || null,
      contact_phone: lead.contact_person_number || lead.primary_phone || null,
      job_title: lead.contact_person_job || null,
      email: lead.email || null,
      phone: lead.primary_phone || null,
      billing_address: lead.address || "No billing address provided",
      shipping_address: lead.address || null,
    };

    // Create customer (CustomersModel.insert generates customer_id)
    console.log('[Service][convert] Profile payload to insert:', JSON.stringify(profilePayload));
    const newCustomer = await CustomersModel.insert(companyId, profilePayload);
    console.log('[Service][convert] New customer created:', JSON.stringify(newCustomer));

    // Link lead -> customer by updating leads.customer_id
    await pool.query(
      `UPDATE leads SET customer_id = $1 WHERE company_id = $2 AND lead_id = $3`,
      [newCustomer.customer_id, companyId, leadId]
    );

    return newCustomer;
  },
};
