// src/modules/inventory/rawMaterialMovement/rawMaterialMovement.route.js
import express from 'express';
import {
  listMovements,
  getMovementById,
  getMovementsForMaterial,
  getLookupData,
  recordMovement,
  updateMovement,
  deleteMovement
} from './rawMaterialMovement.controller.js';

const router = express.Router();

// Get all movements
router.get('/', listMovements);


router.post('/', recordMovement);

// Update a movement by ID
router.put('/:movementId', updateMovement);


router.get('/lookups', getLookupData);

// Get a specific movement by its ID

// Get all movements for a specific raw material
router.get('/material/:rawMaterialId', getMovementsForMaterial);

// Get a specific movement by its ID
router.get('/:movementId', getMovementById);

// Delete a movement by its ID
router.delete('/:movementId', deleteMovement);

// Get all movements for a specific raw material
router.get('/material/:rawMaterialId', getMovementsForMaterial);

export default router;
