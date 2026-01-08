import { Router } from 'express';
import OnboardingController from './onboarding.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

const canRead = permission(['hr.onboarding.read.all', 'hr.read.all']);
const canCreate = permission(['hr.onboarding.create', 'hr.create']);
const canUpdate = permission(['hr.onboarding.update', 'hr.update']);
const canDelete = permission(['hr.onboarding.delete', 'hr.delete']);

// Templates
r.get('/templates', canRead, OnboardingController.listTemplates);
r.get('/templates/:id', canRead, OnboardingController.getTemplate);
r.post('/templates', canCreate, OnboardingController.createTemplate);
r.put('/templates/:id', canUpdate, OnboardingController.updateTemplate);
r.delete('/templates/:id', canDelete, OnboardingController.deleteTemplate);

// Processes
r.get('/', canRead, OnboardingController.listProcesses);
r.get('/:id', canRead, OnboardingController.getProcess);
r.post('/', canCreate, OnboardingController.createProcess);
r.put('/:id', canUpdate, OnboardingController.updateProcess);
r.delete('/:id', canDelete, OnboardingController.deleteProcess);

// Task status update
r.patch('/:id/task/:taskId/status', canUpdate, OnboardingController.updateTaskStatus);

export default r;
