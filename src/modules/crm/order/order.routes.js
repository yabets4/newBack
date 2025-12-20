import { Router } from 'express';
import OrderController from './order.controller.js';

const router = Router();

// Route to get data for creating a sales order
router.get('/leads-with-quotes', OrderController.getLeadsWithQuotes);

// You can add other order-related routes here later
router.post('/', OrderController.create);
router.get('/', OrderController.getAll);
router.get('/:id', OrderController.getById);
router.put('/:id', OrderController.update);
router.delete('/:id', OrderController.delete);

export default router;