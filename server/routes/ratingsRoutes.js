import express from 'express';
import { authenticateToken, requireManager } from '../middleware.js';
import * as ratingsController from '../controllers/ratingsController.js';

const router = express.Router();

router.get('/', authenticateToken, requireManager, ratingsController.getRatings);
router.post('/', authenticateToken, requireManager, ratingsController.createRating);
router.get('/:staffId/:date', authenticateToken, requireManager, ratingsController.getRatingByStaffAndDate);

export default router;
