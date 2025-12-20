// services/leads.service.js
import { LeadsModel } from "./lead.model.js";
import { ensureEmailNotRegistered } from "../emailChecker.js";

export const LeadsService = {
  // List all leads with attachments
  async list(companyId) {
    if (!companyId) throw new Error("companyId is required");
    console.log("[Service] Listing leads for company:", companyId);
    return LeadsModel.findAll(companyId);
  },

  async listExisting(companyId) {
  if (!companyId) throw new Error("companyId is required");
  console.log("[Service] Listing leads for company:", companyId);
  return LeadsModel.findAllExisting(companyId);
  },

  async createLead(companyId, data, attachments = []) {
    if (!companyId) throw new Error("companyId is required");
    console.log("[Service] Creating lead for company:", companyId);
    console.log("[Service] Input data:", data);

    // Required fields check
    const requiredFields = [
      "lead_type",
      "name",
      "primary_phone",
      "lead_source",
      "service_requested",
    ];
    const missingFields = requiredFields.filter((f) => !data[f]);
    if (missingFields.length) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    try {
      // Prevent creation if email already exists in customers or leads
      if (data.email) await ensureEmailNotRegistered(companyId, data.email);
      // Call the model function that handles lead/customer logic
      const newLead = await LeadsModel.createLeadOrCustomer(companyId, data, attachments);

      console.log("[Service] Lead created successfully:", newLead.lead_id);
      return newLead;
    } catch (err) {
      console.error("[Service] Error creating lead:", err);
      throw err;
    }
  },

  // Get a single lead with attachments
  async get(companyId, leadId) {
    if (!companyId || !leadId) throw new Error("companyId and leadId are required");
    console.log("[Service] Fetching lead:", leadId, "for company:", companyId);
    return LeadsModel.findById(companyId, leadId);
  },

  // Create a lead + optional attachments
  async create(companyId, data, attachments = []) {
    if (!companyId) throw new Error("companyId is required");
    console.log("[Service] Creating lead for company:", companyId);
    console.log("[Service] Input data:", data);

    // Required fields check


    try {
      const newLead = await LeadsModel.insert(companyId, data, attachments);

      if (!newLead) {
        throw new Error(`A lead with phone number ${data.primary_phone} already exists.`);
      }

      console.log("[Service] Lead created successfully:", newLead.lead_id);
      return newLead;
    } catch (err) {
      console.log("[Service] Error creating lead:", err);
      throw err;
    }
  },

  // Update a lead + add new attachments
  async update(companyId, leadId, data, newAttachments = [], existingAttachments = []) {
    if (!companyId || !leadId) throw new Error("companyId and leadId are required");
    if (!data || Object.keys(data).length === 0) {
      throw new Error("No data provided to update lead");
    }

    console.log("[Service] Updating lead:", leadId, "for company:", companyId);

    try {
      const updatedLead = await LeadsModel.update(
        companyId,
        leadId,
        data,
        newAttachments,
        existingAttachments
      );
      console.log("[Service] Lead updated successfully:", leadId);
      return updatedLead;
    } catch (err) {
      console.error("[Service] Error updating lead:", err);
      throw err;
    }
  },

  // Delete lead (attachments cascade automatically)
  async delete(companyId, leadId) {
    if (!companyId || !leadId) throw new Error("companyId and leadId are required");
    console.log("[Service] Deleting lead:", leadId, "for company:", companyId);

    try {
      const deleted = await LeadsModel.remove(companyId, leadId);
      console.log("[Service] Lead deleted successfully:", leadId);
      return deleted;
    } catch (err) {
      console.error("[Service] Error deleting lead:", err);
      throw err;
    }
  },
};
