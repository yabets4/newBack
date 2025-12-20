// controllers/leads.controller.js
import { LeadsService } from "./lead.service.js";
import { ok, badRequest, notFound } from "../../../utils/apiResponse.js";

// GET all leads
export async function getLeads(req, res) {
  try {
    const { companyID } = req.auth; 
    const leads = await LeadsService.list(companyID);
    return ok(res, leads);
  } catch (err) {
    return badRequest(res, err.message);
  }
}

export async function getExistingLeads(req, res) {
  try {
    const { companyID } = req.auth; // <-- match service param
    console.log("company id is ", companyID);

    const leads = await LeadsService.listExisting(companyID);
    
    return ok(res, leads);
  } catch (err) {
    console.error("Error fetching leads:", err);
    // Return 500 for unexpected errors
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createLeadOrCustomer(req, res) {
  try {
    const { companyID } = req.auth;
    const leadData = { ...req.body };
    console.log(leadData);
    
    // Prefer descriptions sent in the multipart form under
    // `attachment_descriptions[]` (or `attachment_descriptions`) matching file order.
    let attachmentDescriptions = req.body.attachment_descriptions || req.body['attachment_descriptions[]'] || [];
    if (typeof attachmentDescriptions === 'string') attachmentDescriptions = [attachmentDescriptions];

    const attachments = (req.files || []).map((f, idx) => ({
      file_url: `/uploads/${req.tenantPrefix || "default"}/leads/${f.filename}`,
      description: (attachmentDescriptions && attachmentDescriptions[idx]) ? attachmentDescriptions[idx] : f.originalname,
    }));

    const newLead = await LeadsService.createLead(companyID, leadData, attachments);
    return ok(res, newLead);
  } catch (err) {
  console.error("Lead creation error:", err.message, err.details);
  res.status(400).json({ error: err.message });
}

}


// GET single lead by lead_id (LEAD-XX)
export async function getLead(req, res) {
  try {
    const { companyID } = req.auth;
    const { id: leadId } = req.params;
    const lead = await LeadsService.get(companyID, leadId);
    if (!lead) return notFound(res, "Lead not found");
    return ok(res, lead);
  } catch (err) {
    return badRequest(res, err.message);
  }
}

// CREATE new lead
export async function createLead(req, res) {
  try {
    const { companyID } = req.auth;
    const leadData = { ...req.body };

    // Uploaded files
    let attachmentDescriptions = req.body.attachment_descriptions || req.body['attachment_descriptions[]'] || [];
    if (typeof attachmentDescriptions === 'string') attachmentDescriptions = [attachmentDescriptions];

    const attachments = (req.files || []).map((f, idx) => ({
      file_url: `/uploads/${req.tenantPrefix || "default"}/leads/${f.filename}`,
      description: (attachmentDescriptions && attachmentDescriptions[idx]) ? attachmentDescriptions[idx] : f.originalname,
    }));

    const newLead = await LeadsService.create(companyID, leadData, attachments);
    return ok(res, newLead);
  } catch (err) {
    return badRequest(res, err.message);
  }
}



// UPDATE lead by lead_id
export async function updateLead(req, res) {
  try {
    const { companyID } = req.auth;
    const { id: leadId } = req.params;

    const leadData = { ...req.body };

    // Parse existing attachments JSON
    let existingAttachments = [];
    if (leadData.existing_attachments) {
      const raw = Array.isArray(leadData.existing_attachments)
        ? leadData.existing_attachments
        : [leadData.existing_attachments];
      existingAttachments = raw.map((att) =>
        typeof att === "string" ? JSON.parse(att) : att
      );
      delete leadData.existing_attachments; // don’t pass this down
    }

    // New uploaded files
    let attachmentDescriptions = leadData.attachment_descriptions || leadData['attachment_descriptions[]'] || [];
    if (typeof attachmentDescriptions === 'string') attachmentDescriptions = [attachmentDescriptions];

    const newAttachments = (req.files || []).map((f, idx) => ({
      file_url: `/uploads/${req.tenantPrefix || "default"}/leads/${f.filename}`,
      description: (attachmentDescriptions && attachmentDescriptions[idx]) ? attachmentDescriptions[idx] : f.originalname,
    }));

    const updated = await LeadsService.update(
      companyID,
      leadId,
      leadData,
      newAttachments,
      existingAttachments
    );

    if (!updated) return notFound(res, "Lead not found");
    return ok(res, updated);
  } catch (err) {
    return badRequest(res, err.message);
  }
}

// DELETE lead by lead_id
export async function deleteLead(req, res) {
  try {
    const { companyID } = req.auth;
    const { id: leadId } = req.params;
    const deleted = await LeadsService.delete(companyID, leadId);
    if (!deleted) return notFound(res, "Lead not found");
    return ok(res, { message: "Lead deleted" });
  } catch (err) {
    return badRequest(res, err.message);
  }
}
