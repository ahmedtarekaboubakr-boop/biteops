import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as leaveRequestsController from '../controllers/leaveRequestsController.js';

const router = express.Router();

router.get('/', authenticateToken, leaveRequestsController.getLeaveRequests);
router.post('/', authenticateToken, requireManager, leaveRequestsController.createLeaveRequest);
router.put('/:id', authenticateToken, requireManager, leaveRequestsController.updateLeaveRequest);
router.delete('/', authenticateToken, requireManager, leaveRequestsController.deleteLeaveRequests);

export default router;
