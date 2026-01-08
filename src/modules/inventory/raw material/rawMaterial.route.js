// src/modules/inventory/rawMaterials/rawMaterials.routes.js
import { Router } from "express";
import {
  getRawMaterials,
  getRawMaterial,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  getLocation
} from "./rawMaterial.controller.js";
import { uploadRawMaterialImage } from "../../../middleware/multer.middleware.js";
import Catagories from '../Categories/Categories.route.js';

import permission from "../../../middleware/permission.middleware.js";

const r = Router();

const canRead = permission(['inventory.raw_materials.read.all', 'inventory.read.all']);
const canCreate = permission(['inventory.raw_materials.create', 'inventory.create']);
const canUpdate = permission(['inventory.raw_materials.update', 'inventory.update']);
const canDelete = permission(['inventory.raw_materials.delete', 'inventory.delete']);

r.use("/categories", Catagories);

r.get("/", canRead, getRawMaterials);
r.get("/location/", canRead, getLocation);
r.get("/:id", canRead, getRawMaterial);

r.post("/", canCreate, uploadRawMaterialImage.single("image"), createRawMaterial);
r.put("/:id", canUpdate, uploadRawMaterialImage.single("image"), updateRawMaterial);
r.delete("/:id", canDelete, deleteRawMaterial);

export default r;
