import express from 'express';
import { authenticateToken } from '../middleware.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/reset-password', authController.resetPasswordWithToken);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.put('/password', authenticateToken, authController.changePassword);
router.post('/password-reset-link', authenticateToken, authController.issuePasswordResetLink);

export default router;
