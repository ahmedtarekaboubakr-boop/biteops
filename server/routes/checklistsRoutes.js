import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as checklistsController from '../controllers/checklistsController.js';

const router = express.Router();

router.get('/history', authenticateToken, requireManager, checklistsController.getHistory);
router.get('/', authenticateToken, requireManager, checklistsController.getChecklists);
router.post('/', authenticateToken, requireManager, checklistsController.createChecklist);

export default router;
