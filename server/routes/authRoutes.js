import express from 'express';
import { authenticateToken } from '../middleware.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);

export default router;
