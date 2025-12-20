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

const r = Router();

r.use("/categories", Catagories);

r.get("/", getRawMaterials);
r.get("/location/", getLocation);
r.get("/:id", getRawMaterial);

r.post("/", uploadRawMaterialImage.single("image"), createRawMaterial);
r.put("/:id", uploadRawMaterialImage.single("image"), updateRawMaterial);
r.delete("/:id", deleteRawMaterial);

export default r;
