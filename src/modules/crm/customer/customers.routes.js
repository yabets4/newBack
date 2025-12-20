// src/modules/systemAdmin/customers/customers.routes.js
import { Router } from "express";
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  convertLeadToCustomer,
} from "./customer.controller.js";
import { uploadCustomerPhoto } from "../../../middleware/multer.middleware.js";
import {CheckTierLimit} from "../../../middleware/checkTierLimit.middleware.js";

const r = Router();

r.get("/", getCustomers);
r.get("/:id", getCustomer);

r.post("/", CheckTierLimit('customers'), uploadCustomerPhoto.single("photo"), createCustomer);
r.put("/:id", uploadCustomerPhoto.single("photo"), updateCustomer);

// Convert lead -> customer
r.post("/convert/:leadId", convertLeadToCustomer);

r.delete("/:id", deleteCustomer);



export default r;