import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as leaderboardController from '../controllers/leaderboardController.js';

const router = express.Router();

router.get('/staff', authenticateToken, leaderboardController.getStaffLeaderboard);
router.get('/branches', authenticateToken, requireManager, leaderboardController.getBranchesLeaderboard);

export default router;
