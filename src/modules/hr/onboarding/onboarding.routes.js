import { Router } from 'express';
import OnboardingController from './onboarding.controller.js';

const r = Router();

// Templates
r.get('/templates', OnboardingController.listTemplates);
r.get('/templates/:id', OnboardingController.getTemplate);
r.post('/templates', OnboardingController.createTemplate);
r.put('/templates/:id', OnboardingController.updateTemplate);
r.delete('/templates/:id', OnboardingController.deleteTemplate);

// Processes
r.get('/', OnboardingController.listProcesses);
r.get('/:id', OnboardingController.getProcess);
r.post('/', OnboardingController.createProcess);
r.put('/:id', OnboardingController.updateProcess);
r.delete('/:id', OnboardingController.deleteProcess);

// Task status update
r.patch('/:id/task/:taskId/status', OnboardingController.updateTaskStatus);

export default r;
