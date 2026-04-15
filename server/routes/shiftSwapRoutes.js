import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as shiftSwapController from '../controllers/shiftSwapController.js';

const router = express.Router();

router.get('/colleagues', authenticateToken, shiftSwapController.listColleagues);
router.get('/', authenticateToken, shiftSwapController.listShiftSwaps);
router.post('/', authenticateToken, shiftSwapController.createShiftSwap);
router.patch('/:id/review', authenticateToken, requireManager, shiftSwapController.reviewShiftSwap);
router.post('/:id/cancel', authenticateToken, shiftSwapController.cancelShiftSwap);

export default router;
