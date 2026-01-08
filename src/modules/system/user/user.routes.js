
import { Router } from 'express';
import ctrl from './user.controller.js';
import permission from '../../../middleware/permission.middleware.js';

const r = Router();

// Granular permissions based on Frontend/src/pages/setting/userRoleSetting.jsx
const canReadUsers = permission('users.read.all');
const canUpdateUsers = permission('users.update.all'); // Covers Create/Update
const canDeleteUsers = permission('users.delete.all');

r.get('/', canReadUsers, ctrl.getAllUsers);
r.get('/:userId', canReadUsers, ctrl.getUserById);
r.post('/', canUpdateUsers, ctrl.createUser);
r.put('/:userId', canUpdateUsers, ctrl.updateUser);
r.delete('/:userId', canDeleteUsers, ctrl.removeUser);

export default r;
