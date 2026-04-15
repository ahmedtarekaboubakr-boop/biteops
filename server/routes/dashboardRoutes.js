import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/kpis', authenticateToken, requireManager, dashboardController.getKpis);

export default router;
