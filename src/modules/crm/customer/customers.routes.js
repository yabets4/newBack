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
import { CheckTierLimit } from "../../../middleware/checkTierLimit.middleware.js";
import permission from "../../../middleware/permission.middleware.js";

const r = Router();

const canRead = permission(['customers.read.all', 'customers.read.own_only']);
const canCreate = permission('customers.create');
const canUpdate = permission(['customers.update.all', 'customers.update.own_only']);
const canDelete = permission(['customers.delete.all', 'customers.delete.own_only']);

r.get("/", canRead, getCustomers);
r.get("/:id", canRead, getCustomer);

r.post("/", canCreate, CheckTierLimit('customers'), uploadCustomerPhoto.single("photo"), createCustomer);
r.put("/:id", canUpdate, uploadCustomerPhoto.single("photo"), updateCustomer);

// Convert lead -> customer (requires create customer permission)
r.post("/convert/:leadId", canCreate, convertLeadToCustomer);

r.delete("/:id", canDelete, deleteCustomer);



export default r;