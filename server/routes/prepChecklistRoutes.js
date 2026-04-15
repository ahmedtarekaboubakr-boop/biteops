import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as prepChecklistController from '../controllers/prepChecklistController.js';

const router = express.Router();

router.get('/template', authenticateToken, requireManager, prepChecklistController.getPrepTemplate);
router.get('/', authenticateToken, requireManager, prepChecklistController.getPrepChecklists);
router.post('/', authenticateToken, requireManager, prepChecklistController.upsertPrepChecklist);

export default router;
