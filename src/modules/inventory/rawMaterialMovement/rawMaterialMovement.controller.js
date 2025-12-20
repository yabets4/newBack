// src/modules/inventory/rawMaterialMovement/rawMaterialMovement.controller.js
import { RawMaterialMovementService } from './rawMaterialMovement.service.js';

export const listMovements = async (req, res, next) => {
  try {
    const { companyID } = req.auth;
    const movements = await RawMaterialMovementService.listMovements(companyID);
    res.json(movements);
  } catch (error) {
    next(error);
  }
};

export const getMovementById = async (req, res, next) => {
  try {
    const { companyID } = req.auth;
    const { movementId } = req.params;
    const movement = await RawMaterialMovementService.getMovementById(companyID, movementId);
    if (!movement) {
      return res.status(404).json({ message: 'Movement not found' });
    }
    res.json(movement);
  } catch (error) {
    next(error);
  }
};

export const getMovementsForMaterial = async (req, res, next) => {
  try {
    const { companyID } = req.auth;
    const { rawMaterialId } = req.params;
    const movements = await RawMaterialMovementService.getMovementsForMaterial(companyID, rawMaterialId);
    res.json(movements);
  } catch (error) {
    next(error);
  }
};

export const recordMovement = async (req, res, next) => {
  try {
    const { companyID } = req.auth;
    const newMovement = await RawMaterialMovementService.recordMovement(companyID, req.body);
    res.status(201).json(newMovement);
  } catch (error) {
    next(error);
  }
};

export const deleteMovement = async (req, res, next) => {
  try {
    const { companyID } = req.auth;
    const { movementId } = req.params;
    await RawMaterialMovementService.deleteMovement(companyID, movementId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getLookupData = async (req, res, next) => {
  try {
    const { companyID } = req.auth;
    const lookup = await RawMaterialMovementService.getLookupData(companyID);
    res.json(lookup);
  } catch (error) {
    next(error);
  }
};

export const updateMovement = async (req, res, next) => {
  try {
    const { companyID } = req.auth;
    const { movementId } = req.params;
    const updated = await RawMaterialMovementService.updateMovement(companyID, movementId, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Movement not found' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
