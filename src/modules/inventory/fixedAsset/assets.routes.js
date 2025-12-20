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

const r = Router();

r.get("/", getAssets);
r.get("/location", getLocation);
r.get("/:id", getAsset);
r.post("/", createAsset);
r.put("/:id", updateAsset);
r.delete("/:id", deleteAsset);

export default r;
