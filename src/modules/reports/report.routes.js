import { Router } from 'express';
import ctrl from './report.controller.js';
import auth from '../../middleware/auth.middleware.js';
import tenant from '../../middleware/tenant.middleware.js';
import permission from '../../middleware/permission.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import { createReportSchema, updateReportSchema } from './report.validation.js';

const r = Router(); r.use(auth(true), tenant);
r.get('/', permission('report_read'), ctrl.list);
r.get('/:id', permission('report_read'), ctrl.get);
r.post('/', permission('report_write'), validate(createReportSchema), ctrl.create);
r.put('/:id', permission('report_write'), validate(updateReportSchema), ctrl.update);
r.patch('/:id', permission('report_write'), validate(updateReportSchema), ctrl.update);
r.delete('/:id', permission('report_delete'), ctrl.remove);
export default r;
