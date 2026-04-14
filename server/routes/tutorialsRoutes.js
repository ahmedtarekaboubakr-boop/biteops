import express from 'express';
import { authenticateToken, requireOwner } from '../middleware.js';
import { upload } from '../uploads.js';
import * as tutorialsController from '../controllers/tutorialsController.js';

const router = express.Router();

router.get('/', authenticateToken, tutorialsController.getTutorials);
router.get('/:id', authenticateToken, tutorialsController.getTutorialById);
router.post('/', authenticateToken, requireOwner, upload.single('video'), tutorialsController.createTutorial);
router.delete('/:id', authenticateToken, requireOwner, tutorialsController.deleteTutorial);

export default router;
