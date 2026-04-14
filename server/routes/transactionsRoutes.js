import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as transactionsController from '../controllers/transactionsController.js';

const router = express.Router();

router.get('/', authenticateToken, requireManager, transactionsController.getTransactions);
router.get('/summary', authenticateToken, requireManager, transactionsController.getSummary);
router.post('/', authenticateToken, requireManager, transactionsController.createTransaction);

export default router;
