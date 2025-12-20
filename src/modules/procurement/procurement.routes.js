import { Router } from 'express';
import ctrl from './procurement.controller.js';
import auth from '../../middleware/auth.middleware.js';
import tenant from '../../middleware/tenant.middleware.js';
import permission from '../../middleware/permission.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import { createPOSchema, updatePOSchema } from './procurement.validation.js';

const r = Router(); r.use(auth(true), tenant);
r.get('/', permission('procurement_read'), ctrl.list);
r.get('/:id', permission('procurement_read'), ctrl.get);
r.post('/', permission('procurement_write'), validate(createPOSchema), ctrl.create);
r.put('/:id', permission('procurement_write'), validate(updatePOSchema), ctrl.update);
r.patch('/:id', permission('procurement_write'), validate(updatePOSchema), ctrl.update);
r.delete('/:id', permission('procurement_delete'), ctrl.remove);
export default r;
