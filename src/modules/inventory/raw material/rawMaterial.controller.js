// src/modules/inventory/rawMaterials/rawMaterials.controller.js
import { RawMaterialsService } from "./rawMaterial.service.js";
import { ok, badRequest, notFound } from "../../../utils/apiResponse.js";
import { getCompanyNameById } from "../../../middleware/services/company.service.js";

export async function getRawMaterials(req, res) {
  try {
    const { companyID } = req.auth;
    
    const materials = await RawMaterialsService.list(companyID);
    return ok(res, materials);
  } catch (err) {
        console.log(err);

    return badRequest(res, err.message);
  }
}

export async function getLocation(req, res) {
  try {
    const { companyID } = req.auth;
    const materials = await RawMaterialsService.listLocation(companyID);
    return ok(res, materials);
  } catch (err) {
        console.log(err);

    return badRequest(res, err.message);
  }
}

export async function getRawMaterial(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    const material = await RawMaterialsService.get(companyID, id);
    if (!material) return notFound(res, "Raw material not found");
    return ok(res, material);
  } catch (err) {
    console.log(err);
    
    return badRequest(res, err.message);
  }
}

export async function createRawMaterial(req, res) {
  try {
    const { companyID } = req.auth;
    let data = { ...req.body };
    console.log(data);


    // 1️⃣ Fetch company name for reference only
    const companyName = await getCompanyNameById(companyID) || 'default';
    const safeName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');

    // 2️⃣ Set DB path to match Multer's folder structure
    if (req.file) {
      data.image_url = `/uploads/${safeName}/rawMaterials/${req.file.filename}`;
    }

    // Ensure numeric location_id if provided
    if (data.location_id) {
      const parsed = parseInt(data.location_id, 10);
      data.location_id = Number.isNaN(parsed) ? data.location_id : parsed;
    }

    const newMaterial = await RawMaterialsService.create(companyID, data);
    return ok(res, newMaterial);

  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}

// ------------------------
// UPDATE RAW MATERIAL
export async function updateRawMaterial(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    console.log();
    
    let data = { ...req.body };

    // Fetch company name for reference only
    const companyName = await getCompanyNameById(companyID) || 'default';
    const safeName = companyName.replace(/[^a-zA-Z0-9-_]/g, '_');

    // Set DB path to match Multer's folder structure
    if (req.file) {
      data.image_url = `/uploads/${safeName}/rawMaterials/${req.file.filename}`;
    }

    // Ensure numeric location_id if provided
    if (data.location_id) {
      const parsed = parseInt(data.location_id, 10);
      data.location_id = Number.isNaN(parsed) ? data.location_id : parsed;
    }

    const updated = await RawMaterialsService.update(companyID, id, data);
    return ok(res, updated);

  } catch (err) {
    console.log(err);
    return badRequest(res, err.message);
  }
}

export async function deleteRawMaterial(req, res) {
  try {
    const { companyID } = req.auth;
    const { id } = req.params;
    await RawMaterialsService.delete(companyID, id);
    return ok(res, { message: "Deleted successfully" });
  } catch (err) {
    return badRequest(res, err.message);
  }
}
