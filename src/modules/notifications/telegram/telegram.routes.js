import { Router } from 'express';
import telegramController from './telegram.controller.js';
import { authenticateJWT } from '../../../middleware/jwt.middleware.js';

const router = Router();

// Settings
router.get('/settings', authenticateJWT, telegramController.getSettings);
router.put('/settings', authenticateJWT, telegramController.updateSettings);

// Test & Manual Trigger
router.post('/test', authenticateJWT, telegramController.sendTestMessage);
router.post('/run-automation', authenticateJWT, telegramController.runAutomationManually);

// Subscribers
router.get('/subscribers', authenticateJWT, telegramController.getSubscribers);

export default router;
