import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as attendanceController from '../controllers/attendanceController.js';

const router = express.Router();

router.get('/branch-statistics', authenticateToken, attendanceController.getBranchStatistics);
router.get('/summary', authenticateToken, requireManager, attendanceController.getSummary);
router.post('/fingerprint', authenticateToken, requireManager, attendanceController.createFingerprintLog);
router.get('/fingerprint', authenticateToken, requireManager, attendanceController.getFingerprintLogs);
router.post('/clock', authenticateToken, requireManager, attendanceController.clockInOut);
router.get('/', authenticateToken, requireManager, attendanceController.getAttendance);

export default router;
