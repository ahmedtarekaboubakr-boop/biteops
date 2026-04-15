import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as incidentController from '../controllers/incidentController.js';

const router = express.Router();

router.get('/', authenticateToken, requireManager, incidentController.listIncidents);
router.post('/', authenticateToken, requireManager, incidentController.createIncident);
router.put('/:id', authenticateToken, requireManager, incidentController.updateIncident);
router.delete('/:id', authenticateToken, requireManager, incidentController.deleteIncident);

export default router;
