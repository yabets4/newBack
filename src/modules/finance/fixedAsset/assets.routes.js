// src/modules/systemAdmin/assets/assets.routes.js
import { Router } from "express";
import {
  getAssets,
  getAsset,
  deleteAsset,
  getLocation,
  createAsset,
  updateAsset,
  getDepreciation,
  getDisposalReport,
} from "./asset.controller.js";

import permission from "../../../middleware/permission.middleware.js";

const r = Router();

const canRead = permission(['finance.assets.read.all', 'finance.read.all']);
const canCreate = permission(['finance.assets.create', 'finance.create']);
const canUpdate = permission(['finance.assets.update', 'finance.update']);
const canDelete = permission(['finance.assets.delete', 'finance.delete']);

// Collection routes
r.get("/", canRead, getAssets);
r.post("/", canCreate, createAsset);
r.get("/location", canRead, getLocation);

// Depreciation and disposal reporting (static paths must come before param routes)
r.get("/depreciation", canRead, getDepreciation);
r.get("/disposal-report", canRead, getDisposalReport);

// Single resource routes
r.get("/:id", canRead, getAsset);
r.put("/:id", canUpdate, updateAsset);
r.delete("/:id", canDelete, deleteAsset);

export default r;
