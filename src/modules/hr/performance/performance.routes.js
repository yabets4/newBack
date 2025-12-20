import { Router } from 'express';
import PerformanceController from './performance.controller.js';

const r = Router();

// Reviews
r.get('/reviews', PerformanceController.listReviews);
r.get('/reviews/:id', PerformanceController.getReview);
r.post('/reviews', PerformanceController.createReview);
r.put('/reviews/:id', PerformanceController.updateReview);
r.delete('/reviews/:id', PerformanceController.deleteReview);

// Feedback
r.get('/feedback', PerformanceController.listFeedback);
r.get('/feedback/:id', PerformanceController.getFeedback);
r.post('/feedback', PerformanceController.createFeedback);
r.delete('/feedback/:id', PerformanceController.deleteFeedback);

// Dashboard
r.get('/dashboard', PerformanceController.dashboard);

export default r;
