import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as inventoryController from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/', authenticateToken, requireManager, inventoryController.getInventory);
router.post('/', authenticateToken, requireManager, inventoryController.createInventory);
router.post('/receive', authenticateToken, requireManager, inventoryController.receiveStock);
router.post('/transfer', authenticateToken, requireManager, inventoryController.transferStock);
router.get('/transfers', authenticateToken, requireManager, inventoryController.getTransfers);
router.get('/transfers/incoming', authenticateToken, requireManager, inventoryController.getIncomingTransfers);
router.put('/transfers/:id/respond', authenticateToken, requireManager, inventoryController.respondToTransfer);
router.post('/waste', authenticateToken, requireManager, inventoryController.recordWaste);
router.get('/waste', authenticateToken, requireManager, inventoryController.getWaste);
router.post('/spot-check', authenticateToken, requireManager, inventoryController.createSpotCheck);
router.get('/spot-check', authenticateToken, requireManager, inventoryController.getSpotChecks);

export default router;
