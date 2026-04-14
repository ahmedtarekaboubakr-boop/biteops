import express from 'express';
import { authenticateToken, requireHR } from '../middleware.js';
import * as notificationsController from '../controllers/notificationsController.js';

const router = express.Router();

router.get('/', authenticateToken, requireHR, notificationsController.getNotifications);
router.put('/:id/read', authenticateToken, requireHR, notificationsController.markAsRead);
router.put('/read-all', authenticateToken, requireHR, notificationsController.markAllAsRead);

export default router;
