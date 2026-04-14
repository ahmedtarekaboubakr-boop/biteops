import express from 'express';
import { authenticateToken, requireHR } from '../middleware.js';
import { getBranchManagers } from '../controllers/branchesController.js';

const router = express.Router();

router.get('/', authenticateToken, requireHR, getBranchManagers);

export default router;
