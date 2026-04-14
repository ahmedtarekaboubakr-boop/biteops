import express from 'express';
import { authenticateToken, requireHR } from '../middleware.js';
import * as branchesController from '../controllers/branchesController.js';

const router = express.Router();

router.get('/', authenticateToken, requireHR, branchesController.getBranches);
router.post('/', authenticateToken, requireHR, branchesController.createBranch);
router.post('/initialize', authenticateToken, requireHR, branchesController.initializeBranches);
router.get('/:id', authenticateToken, requireHR, branchesController.getBranchById);
router.put('/:id', authenticateToken, requireHR, branchesController.updateBranch);
router.delete('/:id', authenticateToken, requireHR, branchesController.deleteBranch);
router.put('/:id/assign-staff', authenticateToken, requireHR, branchesController.assignStaff);
router.get('/:id/available-staff', authenticateToken, requireHR, branchesController.getAvailableStaff);

export default router;
