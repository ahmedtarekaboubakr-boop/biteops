import express from 'express';
import { authenticateToken, requireOwner } from '../middleware.js';
import { upload } from '../uploads.js';
import * as tutorialsController from '../controllers/tutorialsController.js';

const router = express.Router();

// Folder routes (must be declared before /:id)
router.get('/folders', authenticateToken, tutorialsController.getFolders);
router.post('/folders', authenticateToken, requireOwner, tutorialsController.createFolder);
router.delete('/folders/:id', authenticateToken, requireOwner, tutorialsController.deleteFolder);

// Tutorial routes
router.get('/', authenticateToken, tutorialsController.getTutorials);
router.get('/:id', authenticateToken, tutorialsController.getTutorialById);
router.post('/', authenticateToken, requireOwner, upload.single('video'), tutorialsController.createTutorial);
router.delete('/:id', authenticateToken, requireOwner, tutorialsController.deleteTutorial);

export default router;
