// src/modules/inventory/rawMaterials/rawMaterials.service.js
import { RawMaterialsModel } from "./rawMaterial.model.js";

export const RawMaterialsService = {
  async list(companyId) {
    return await RawMaterialsModel.findAll(companyId);
  },
  async listLocation(companyId) {
    return await RawMaterialsModel.findAllLocation(companyId);
  },

  async get(companyId, rawMaterialId) {
    return await RawMaterialsModel.findById(companyId, rawMaterialId);
  },

  async create(companyId, data) {
    // require location_id (id of location) instead of free-form location name
    const requiredFields = ["name","category_id","uom","cost_price","minimum_stock","supplier_id"];
    const missing = requiredFields.filter(f => !data[f]);
    if (missing.length) throw new Error(`Missing required fields: ${missing.join(", ")}`);
    return await RawMaterialsModel.insert(companyId, data);
  },

  async update(companyId, rawMaterialId, data) {
    return await RawMaterialsModel.update(companyId, rawMaterialId, data);
  },

  async delete(companyId, rawMaterialId) {
    const deleted = await RawMaterialsModel.delete(companyId, rawMaterialId);
    if (!deleted) throw new Error("Raw material not found");
    return true;
  }
};
