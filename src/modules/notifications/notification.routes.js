import { Router } from 'express';
import ctrl from './notification.controller.js';
import auth from '../../middleware/auth.middleware.js';
import tenant from '../../middleware/tenant.middleware.js';
import permission from '../../middleware/permission.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import { createNotificationSchema, updateNotificationSchema } from './notification.validation.js';

const r = Router(); r.use(auth(true), tenant);
r.get('/', permission('notification_read'), ctrl.list);
r.get('/:id', permission('notification_read'), ctrl.get);
r.post('/', permission('notification_write'), validate(createNotificationSchema), ctrl.create);
r.put('/:id', permission('notification_write'), validate(updateNotificationSchema), ctrl.update);
r.patch('/:id', permission('notification_write'), validate(updateNotificationSchema), ctrl.update);
r.delete('/:id', permission('notification_delete'), ctrl.remove);
export default r;
