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

import permission from '../../../middleware/permission.middleware.js'; // Adjust path based on depth

const router = express.Router();

const canRead = permission(['inventory.movements.read.all', 'inventory.read.all']);
const canCreate = permission(['inventory.movements.create', 'inventory.create']);
const canUpdate = permission(['inventory.movements.update', 'inventory.update']);
const canDelete = permission(['inventory.movements.delete', 'inventory.delete']);

// Get all movements
router.get('/', canRead, listMovements);


router.post('/', canCreate, recordMovement);

// Update a movement by ID
router.put('/:movementId', canUpdate, updateMovement);


router.get('/lookups', canRead, getLookupData);

// Get a specific movement by its ID

// Get all movements for a specific raw material
router.get('/material/:rawMaterialId', canRead, getMovementsForMaterial);

// Get a specific movement by its ID
router.get('/:movementId', canRead, getMovementById);

// Delete a movement by its ID
router.delete('/:movementId', canDelete, deleteMovement);

// Get all movements for a specific raw material
router.get('/material/:rawMaterialId', getMovementsForMaterial);

export default router;
