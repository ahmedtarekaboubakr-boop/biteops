import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as scheduleController from '../controllers/scheduleController.js';

const router = express.Router();

// More specific routes first
router.get('/date/:date', authenticateToken, requireManager, scheduleController.getSchedulesByDate);
router.get('/submission-status', authenticateToken, requireManager, scheduleController.getSubmissionStatus);
router.post('/submit', authenticateToken, requireManager, scheduleController.submitSchedule);
router.post('/swap', authenticateToken, requireManager, scheduleController.swapSchedules);

router.get('/', authenticateToken, requireManager, scheduleController.getSchedules);
router.post('/', authenticateToken, requireManager, scheduleController.createSchedule);
router.delete('/:id', authenticateToken, requireManager, scheduleController.deleteSchedule);

export default router;
