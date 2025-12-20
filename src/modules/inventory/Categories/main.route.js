import Umo from './uom.js';
import { Router } from 'express';
import Categories from './Categories.route.js';

const r = Router()

r.use('/uoms', Umo);
r.use('/', Categories);

export default r;