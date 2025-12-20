import { Router } from 'express';
import OffboardingController from './offboarding.controller.js';

const r = Router();

// Templates
r.get('/templates', OffboardingController.listTemplates);
r.get('/templates/:id', OffboardingController.getTemplate);
r.post('/templates', OffboardingController.createTemplate);
r.put('/templates/:id', OffboardingController.updateTemplate);
r.delete('/templates/:id', OffboardingController.deleteTemplate);

// Processes
r.get('/', OffboardingController.listProcesses);
r.get('/:id', OffboardingController.getProcess);
r.post('/', OffboardingController.createProcess);
r.put('/:id', OffboardingController.updateProcess);
r.delete('/:id', OffboardingController.deleteProcess);

// Task status update
r.patch('/:id/task/:taskId/status', OffboardingController.updateTaskStatus);

export default r;
