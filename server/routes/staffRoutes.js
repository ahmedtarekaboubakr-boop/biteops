import express from 'express';
import { authenticateToken, requireManager, requireHR, requireOwner } from '../middleware.js';
import { uploadPhoto, uploadCertificate } from '../uploads.js';
import * as staffController from '../controllers/staffController.js';
import * as staffCredentialsController from '../controllers/staffCredentialsController.js';

const router = express.Router();

// More specific routes first
router.get('/my-schedule', authenticateToken, staffController.getMySchedule);
router.get('/my-ratings', authenticateToken, staffController.getMyRatings);
router.get('/my-attendance', authenticateToken, staffController.getMyAttendance);
router.get('/my-requests', authenticateToken, staffController.getMyRequests);
router.get('/my-penalties', authenticateToken, staffController.getMyPenalties);

router.post('/', authenticateToken, requireHR, staffController.createStaff);
router.post(
  '/generate-credentials',
  authenticateToken,
  requireOwner,
  staffCredentialsController.generateCredentials
);
router.get('/', authenticateToken, requireManager, staffController.getStaff);
router.post('/:id/photo', authenticateToken, requireHR, uploadPhoto.single('photo'), staffController.uploadPhoto);
router.post('/:id/health-certificate', authenticateToken, requireHR, uploadCertificate.single('certificate'), staffController.uploadHealthCertificate);
router.get('/:id', authenticateToken, staffController.getStaffById);
router.put('/:id', authenticateToken, requireHR, staffController.updateStaff);
router.delete('/:id', authenticateToken, requireHR, staffController.deleteStaff);
router.get('/:id/employment-history', authenticateToken, requireManager, staffController.getEmploymentHistory);
router.post('/:id/employment-history', authenticateToken, requireHR, staffController.addEmploymentHistory);
router.put('/:id/reactivate', authenticateToken, requireHR, staffController.reactivateStaff);
router.get('/:id/leave-balance', authenticateToken, staffController.getLeaveBalance);
router.put('/:id/leave-balance', authenticateToken, requireManager, staffController.updateLeaveBalance);

export default router;
