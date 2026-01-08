// src/modules/systemAdmin/assets/assets.routes.js
import { Router } from "express";
import {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  getLocation
} from "./asset.controller.js";

import permission from "../../../middleware/permission.middleware.js";

const r = Router();

const canRead = permission(['inventory.assets.read.all', 'inventory.read.all', 'finance.assets.read.all']);
const canCreate = permission(['inventory.assets.create', 'inventory.create', 'finance.assets.create']);
const canUpdate = permission(['inventory.assets.update', 'inventory.update', 'finance.assets.update']);
const canDelete = permission(['inventory.assets.delete', 'inventory.delete', 'finance.assets.delete']);

r.get("/", canRead, getAssets);
r.get("/location", canRead, getLocation);
r.get("/:id", canRead, getAsset);
r.post("/", canCreate, createAsset);
r.put("/:id", canUpdate, updateAsset);
r.delete("/:id", canDelete, deleteAsset);

export default r;
