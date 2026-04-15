import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as onboardingController from '../controllers/onboardingController.js';

const router = express.Router();

router.get('/tasks', authenticateToken, requireManager, onboardingController.listTasks);
router.post('/tasks', authenticateToken, requireManager, onboardingController.createTask);
router.put('/tasks/:id', authenticateToken, requireManager, onboardingController.updateTask);
router.delete('/tasks/:id', authenticateToken, requireManager, onboardingController.deleteTask);

export default router;
