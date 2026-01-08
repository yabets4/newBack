import { Router } from 'express';
import PerformanceController from './performance.controller.js';

import permission from '../../../middleware/permission.middleware.js';

const r = Router();

// Reviews
// Everyone can see their own reviews? Usually handled by controller logic. Permission checks generic access.
const canRead = permission(['hr.performance.read.all', 'hr.performance.read.own_only']);
const canCreate = permission(['hr.performance.create', 'hr.create']);
const canUpdate = permission(['hr.performance.update', 'hr.update']);
const canDelete = permission(['hr.performance.delete', 'hr.delete']);

r.get('/reviews', canRead, PerformanceController.listReviews);
r.get('/reviews/:id', canRead, PerformanceController.getReview);
r.post('/reviews', canCreate, PerformanceController.createReview);
r.put('/reviews/:id', canUpdate, PerformanceController.updateReview);
r.delete('/reviews/:id', canDelete, PerformanceController.deleteReview);

// Feedback
r.get('/feedback', canRead, PerformanceController.listFeedback);
r.get('/feedback/:id', canRead, PerformanceController.getFeedback);
r.post('/feedback', canCreate, PerformanceController.createFeedback);
r.delete('/feedback/:id', canDelete, PerformanceController.deleteFeedback);

// Dashboard
r.get('/dashboard', canRead, PerformanceController.dashboard);

export default r;
