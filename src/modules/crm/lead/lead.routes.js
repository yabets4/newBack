import { Router } from "express";
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  createLeadOrCustomer,
  getExistingLeads,
} from "./lead.controller.js";
import { uploadLeadAttachment } from "../../../middleware/multer.middleware.js";
import { CheckTierLimit } from "../../../middleware/checkTierLimit.middleware.js";
import permission from "../../../middleware/permission.middleware.js";

const r = Router();

const canRead = permission(['leads.read.all', 'leads.read.own_only']);
const canCreate = permission('leads.create');
const canUpdate = permission(['leads.update.all', 'leads.update.own_only']);
const canDelete = permission(['leads.delete.all', 'leads.delete.own_only']);

r.get("/existing", canRead, getExistingLeads);
r.post("/existing", canCreate, uploadLeadAttachment.array("attachments"), createLeadOrCustomer);

r.get("/", canRead, getLeads);

r.get("/:id", canRead, getLead);
r.post("/", canCreate, CheckTierLimit('leads'), uploadLeadAttachment.array("attachments"), createLead);
r.put("/:id", canUpdate, uploadLeadAttachment.array("attachments"), updateLead);
r.delete("/:id", canDelete, deleteLead);

// New route for leads with null customer_id


export default r;

