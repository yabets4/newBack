import { Router } from 'express';
import smsController from './sms.controller.js';
import { authenticateJWT } from '../../../middleware/jwt.middleware.js';

const router = Router();

// Send SMS
// Get message history
router.post('/send', authenticateJWT, smsController.sendSMS);
router.get('/messages', authenticateJWT, smsController.getMessages);
router.get('/stats', authenticateJWT, smsController.getStats);

// Settings
router.get('/settings', authenticateJWT, smsController.getSettings);
router.put('/settings', authenticateJWT, smsController.updateSettings);

// Templates
router.get('/templates', authenticateJWT, smsController.getTemplates);
router.post('/templates', authenticateJWT, smsController.createTemplate);
router.put('/templates/:id', authenticateJWT, smsController.updateTemplate);
router.delete('/templates/:id', authenticateJWT, smsController.deleteTemplate);

// Custom App Public Listener (Polling & Status)
// Note: These will also be available on /api/public/sms for true public access
router.get('/queue', authenticateJWT, smsController.getQueue);
router.post('/status', authenticateJWT, smsController.updateStatus);

export default router;
