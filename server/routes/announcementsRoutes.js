import express from 'express';
import { authenticateToken, requireOwner } from '../middleware.js';
import * as announcementsController from '../controllers/announcementsController.js';

const router = express.Router();

router.post('/', authenticateToken, announcementsController.createAnnouncement);
router.get('/', authenticateToken, announcementsController.getAnnouncements);
router.post('/:id/dismiss', authenticateToken, announcementsController.dismissAnnouncement);
router.get('/all', authenticateToken, announcementsController.getAllAnnouncements);

export default router;
