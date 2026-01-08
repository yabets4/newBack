// src/modules/systemAdmin/assets/asset.service.js
import { AssetsModel } from "./asset.model.js";
import TransactionManager from '../transaction.manager.js';

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
    // Delegate to TransactionManager
    // payload normalization might be needed if date field is acquisition_date
    const payload = { ...data, date: data.acquisition_date };
    const result = await TransactionManager.handleEvent(companyId, 'FIXED_ASSET_CREATE', payload, 'system');
    return result.businessRecord;
  },

  async update(companyId, assetId, data) {
    throw new Error('Direct updates to assets are disabled. Use adjustments or reversal.');
  },

  async delete(companyId, assetId) {
    throw new Error('Deletion of assets is disabled. Use disposal or reversal.');
  },

  async reverseAsset(companyId, assetId, reason, user) {
    return await TransactionManager.reverseTransaction(companyId, 'FIXED_ASSET', assetId, reason, user);
  }
  ,

  async depreciation(companyId, assetId = null) {
    return await AssetsModel.depreciation(companyId, assetId);
  },

  async disposalReport(companyId) {
    return await AssetsModel.findDisposals(companyId);
  }
};
