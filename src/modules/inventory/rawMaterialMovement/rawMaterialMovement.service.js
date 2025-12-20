// src/modules/inventory/rawMaterialMovement/rawMaterialMovement.service.js
import { RawMaterialMovementModel } from './rawMaterialMovement.model.js';

export const RawMaterialMovementService = {
  async listMovements(companyId) {
    return RawMaterialMovementModel.findAll(companyId);
  },

  async getMovementById(companyId, movementId) {
    return RawMaterialMovementModel.findById(companyId, movementId);
  },

  async getMovementsForMaterial(companyId, rawMaterialId) {
    return RawMaterialMovementModel.findByRawMaterialId(companyId, rawMaterialId);
  },

  async recordMovement(companyId, data) {
    // Basic validation
    if (!data.rawMaterialId || !data.movementType || !data.quantity || !data.movementDate) {
      throw new Error("Missing required fields for movement.");
    }
    return RawMaterialMovementModel.create(companyId, data);
  },

  async getLookupData(companyId) {
    // Delegate to model which fetches raw materials, suppliers and locations
    return RawMaterialMovementModel.getLookupData(companyId);
  },

  async deleteMovement(companyId, movementId) {
    const deletedMovement = await RawMaterialMovementModel.delete(companyId, movementId);
    if (!deletedMovement) {
      throw new Error("Movement not found or already deleted.");
    }
    return deletedMovement;
  }
  ,

  async updateMovement(companyId, movementId, data) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('No data provided for update.');
    }
    const updated = await RawMaterialMovementModel.update(companyId, movementId, data);
    if (!updated) {
      throw new Error('Movement not found');
    }
    return updated;
  }
};
