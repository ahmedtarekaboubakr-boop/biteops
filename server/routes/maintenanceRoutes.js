import express from 'express';
import { authenticateToken, requireOwner, requireManager } from '../middleware.js';
import * as maintenanceController from '../controllers/maintenanceController.js';

const router = express.Router();

router.get('/', authenticateToken, requireManager, maintenanceController.getMaintenance);
router.post('/', authenticateToken, requireOwner, maintenanceController.createMaintenance);
router.put('/:id', authenticateToken, requireOwner, maintenanceController.updateMaintenance);
router.delete('/:id', authenticateToken, requireOwner, maintenanceController.deleteMaintenance);

export default router;
