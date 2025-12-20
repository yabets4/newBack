import { AssetsService } from "./asset.service.js";
import { ok, badRequest, notFound } from "../../../utils/apiResponse.js";

// GET all assets
export async function getAssets(req, res) {
  try {
    const { companyID } = req.auth;
    const assets = await AssetsService.list(companyID);
    return ok(res, assets);
  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}

export async function getLocation(req, res) {
  try {
    const { companyID } = req.auth;
    const materials = await AssetsService.listLocation(companyID);
    return ok(res, materials);
  } catch (err) {
      console.log(err);

    return badRequest(res, err.message);
  }
}

// GET single asset
export async function getAsset(req, res) {
  try {
    const { companyID } = req.auth;
    const { id: assetId } = req.params;
    const asset = await AssetsService.get(companyID, assetId);
    if (!asset) return notFound(res, "Asset not found");
    return ok(res, asset);
  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}

// CREATE asset
export async function createAsset(req, res) {
  try {
    const { companyID } = req.auth;
    const newAsset = await AssetsService.create(companyID, req.body);
    return ok(res, newAsset);
  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}

// UPDATE asset
export async function updateAsset(req, res) {
  try {
    const { companyID } = req.auth;
    const { id: assetId } = req.params;
    const updated = await AssetsService.update(companyID, assetId, req.body);
    return ok(res, updated);
  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}

// DELETE asset
export async function deleteAsset(req, res) {
  try {
    const { companyID } = req.auth;
    const { id: assetId } = req.params;
    const deleted = await AssetsService.delete(companyID, assetId);
    return ok(res, deleted);
  } catch (err) {
    return badRequest(res, err.message);
  }
}

// GET depreciation (single asset if id query provided, else all)
export async function getDepreciation(req, res) {
  try {
    const { companyID } = req.auth;
    const { assetId } = req.query; // optional
    const depreciation = await AssetsService.depreciation(companyID, assetId || null);
    return ok(res, depreciation);
  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}

// GET disposal report
export async function getDisposalReport(req, res) {
  try {
    const { companyID } = req.auth;
    const report = await AssetsService.disposalReport(companyID);
    return ok(res, report);
  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}
