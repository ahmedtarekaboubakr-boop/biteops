import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as ctrl from '../controllers/monthlyRosterController.js';

const router = express.Router();

router.get('/',                    authenticateToken, requireManager, ctrl.getRoster);
router.get('/submission-status',   authenticateToken, requireManager, ctrl.getSubmissionStatus);
router.put('/entry',               authenticateToken, requireManager, ctrl.upsertEntry);
router.delete('/entry',            authenticateToken, requireManager, ctrl.deleteEntry);
router.post('/submit',             authenticateToken, requireManager, ctrl.submitRoster);

export default router;
