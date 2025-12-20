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

const r = Router();

// Collection routes
r.get("/", getAssets);
r.post("/", createAsset);
r.get("/location", getLocation);

// Depreciation and disposal reporting (static paths must come before param routes)
r.get("/depreciation", getDepreciation);
r.get("/disposal-report", getDisposalReport);

// Single resource routes
r.get("/:id", getAsset);
r.put("/:id", updateAsset);
r.delete("/:id", deleteAsset);

export default r;
