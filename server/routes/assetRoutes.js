import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as assetController from '../controllers/assetController.js';

const router = express.Router();

router.get('/', authenticateToken, requireManager, assetController.listAssets);
router.post('/', authenticateToken, requireManager, assetController.createAsset);
router.put('/:id', authenticateToken, requireManager, assetController.updateAsset);
router.delete('/:id', authenticateToken, requireManager, assetController.deleteAsset);

export default router;
