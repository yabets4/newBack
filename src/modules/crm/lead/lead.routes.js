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

const r = Router();


r.get("/existing", getExistingLeads);
r.post("/existing", uploadLeadAttachment.array("attachments"), createLeadOrCustomer); 


r.get("/", getLeads);

r.get("/:id", getLead);
r.post("/", CheckTierLimit('leads'), uploadLeadAttachment.array("attachments"), createLead);
r.put("/:id", uploadLeadAttachment.array("attachments"), updateLead);
r.delete("/:id", deleteLead);

// New route for leads with null customer_id


export default r;

