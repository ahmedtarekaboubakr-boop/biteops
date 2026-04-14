import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as penaltiesController from '../controllers/penaltiesController.js';

const router = express.Router();

router.post('/', authenticateToken, requireManager, penaltiesController.createPenalty);
router.get('/', authenticateToken, requireManager, penaltiesController.getPenalties);
router.get('/:id', authenticateToken, requireManager, penaltiesController.getPenaltyById);
router.put('/:id', authenticateToken, requireManager, penaltiesController.updatePenalty);
router.delete('/:id', authenticateToken, requireManager, penaltiesController.deletePenalty);

export default router;
