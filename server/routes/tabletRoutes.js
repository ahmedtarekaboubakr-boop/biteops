import express from 'express';
import * as tabletController from '../controllers/tabletController.js';

const router = express.Router();

// No auth on tablet endpoints (branch validation only)
router.get('/staff/:branchName', tabletController.getTabletStaff);
router.post('/clock', tabletController.tabletClock);

export default router;
