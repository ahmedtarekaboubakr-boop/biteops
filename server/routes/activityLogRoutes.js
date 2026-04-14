import express from 'express';
import { authenticateToken, requireOwner } from '../middleware.js';
import * as activityLogController from '../controllers/activityLogController.js';

const router = express.Router();

router.get('/', authenticateToken, requireOwner, activityLogController.getActivityLog);
router.get('/count', authenticateToken, requireOwner, activityLogController.getActivityLogCount);
router.delete('/', authenticateToken, requireOwner, activityLogController.clearActivityLog);
router.delete('/:id', authenticateToken, requireOwner, activityLogController.deleteActivityLog);

export default router;
