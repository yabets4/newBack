// src/modules/systemAdmin/assets/asset.service.js
import { AssetsModel } from "./asset.model.js";

export const AssetsService = {
  async list(companyId) {
    return await AssetsModel.findAll(companyId);
  },

  async listLocation(companyId) {
    return await AssetsModel.findAllLocation(companyId);
  },
  
  async get(companyId, assetId) {
    return await AssetsModel.findById(companyId, assetId);
  },

  async create(companyId, data) {
    // Basic validation
    return await AssetsModel.insert(companyId, data);
  },

  async update(companyId, assetId, data) {
    return await AssetsModel.update(companyId, assetId, data);
  },

  async delete(companyId, assetId) {
    return await AssetsModel.delete(companyId, assetId);
  }
  ,

  async depreciation(companyId, assetId = null) {
    return await AssetsModel.depreciation(companyId, assetId);
  },

  async disposalReport(companyId) {
    return await AssetsModel.findDisposals(companyId);
  }
};
