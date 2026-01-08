import Umo from './uom.js';
import { Router } from 'express';
import Categories from './Categories.route.js';
import permission from '../../../middleware/permission.middleware.js';

const r = Router()

const canRead = permission(['inventory.categories.read.all', 'inventory.read.all']);

r.use('/uoms', Umo);
r.use('/', canRead, Categories); // Apply generic read permission or dive deeper if categories has write operations

// Reading file first
export default r;