import express from 'express';
import { authenticateToken, requirePayrollExport } from '../middleware.js';
import * as reportsController from '../controllers/reportsController.js';

const router = express.Router();

router.get('/payroll-csv', authenticateToken, requirePayrollExport, reportsController.getPayrollCsv);

export default router;
