import { Router } from 'express';
import OffboardingController from './offboarding.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['hr.offboarding.read.all', 'hr.read.all']);
const canCreate = permission(['hr.offboarding.create', 'hr.create']);
const canUpdate = permission(['hr.offboarding.update', 'hr.update']);
const canDelete = permission(['hr.offboarding.delete', 'hr.delete']);

// Templates
r.get('/templates', canRead, OffboardingController.listTemplates);
r.get('/templates/:id', canRead, OffboardingController.getTemplate);
r.post('/templates', canCreate, OffboardingController.createTemplate);
r.put('/templates/:id', canUpdate, OffboardingController.updateTemplate);
r.delete('/templates/:id', canDelete, OffboardingController.deleteTemplate);

// Processes
r.get('/', canRead, OffboardingController.listProcesses);
r.get('/:id', canRead, OffboardingController.getProcess);
r.post('/', canCreate, OffboardingController.createProcess);
r.put('/:id', canUpdate, OffboardingController.updateProcess);
r.delete('/:id', canDelete, OffboardingController.deleteProcess);

// Task status update
r.patch('/:id/task/:taskId/status', canUpdate, OffboardingController.updateTaskStatus);

export default r;
