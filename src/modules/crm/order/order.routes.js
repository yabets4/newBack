import { Router } from 'express';
import OrderController from './order.controller.js';
import permission from '../../../middleware/permission.middleware.js';

const router = Router();

const canRead = permission(['orders.read.all', 'orders.read.own_only']);
const canCreate = permission('orders.create');
const canUpdate = permission(['orders.update.all', 'orders.update.own_only']);
const canDelete = permission(['orders.delete.all', 'orders.delete.own_only']);

// Route to get data for creating a sales order
router.get('/leads-with-quotes', canRead, OrderController.getLeadsWithQuotes);

// You can add other order-related routes here later
router.post('/', canCreate, OrderController.create);
router.get('/', canRead, OrderController.getAll);
router.get('/:id', canRead, OrderController.getById);
router.put('/:id', canUpdate, OrderController.update);
router.delete('/:id', canDelete, OrderController.delete);

export default router;