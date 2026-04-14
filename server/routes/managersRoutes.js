import express from 'express';
import { authenticateToken, requireOwner } from '../middleware.js';
import * as managersController from '../controllers/managersController.js';

const router = express.Router();

router.post('/', authenticateToken, requireOwner, managersController.createManager);
router.get('/', authenticateToken, requireOwner, managersController.getManagers);
router.get('/:id', authenticateToken, requireOwner, managersController.getManagerById);
router.put('/:id', authenticateToken, requireOwner, managersController.updateManager);
router.delete('/:id', authenticateToken, requireOwner, managersController.deleteManager);

export default router;
