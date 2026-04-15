import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import './db.js';
import './uploads.js';

import authRoutes from './routes/authRoutes.js';
import managersRoutes from './routes/managersRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';
import ratingsRoutes from './routes/ratingsRoutes.js';
import announcementsRoutes from './routes/announcementsRoutes.js';
import tutorialsRoutes from './routes/tutorialsRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import leaveRequestsRoutes from './routes/leaveRequestsRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import penaltiesRoutes from './routes/penaltiesRoutes.js';
import checklistsRoutes from './routes/checklistsRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import transactionsRoutes from './routes/transactionsRoutes.js';
import branchesRoutes from './routes/branchesRoutes.js';
import branchManagersRoutes from './routes/branchManagersRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import tabletRoutes from './routes/tabletRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow requests from Vercel frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://biteops.vercel.app'
    ];
    
    // Check if origin is in allowed list OR ends with .vercel.app
    const isAllowed = allowedOrigins.includes(origin) || 
                      (origin.includes('.vercel.app'));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use(express.static(join(__dirname, 'dist')));

app.use('/api/auth', authRoutes);
app.use('/api/managers', managersRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/tutorials', tutorialsRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/leave-requests', leaveRequestsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/penalties', penaltiesRoutes);
app.use('/api/checklists', checklistsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/branch-managers', branchManagersRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/tablet', tabletRoutes);

// Catch-all to serve SPA (only for non-API GET requests)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const indexPath = join(__dirname, 'dist', 'index.html');
  
  // Check if dist folder exists
  try {
    res.sendFile(indexPath);
  } catch (error) {
    console.error('❌ ERROR: Cannot find dist/index.html');
    console.error('This usually means the frontend build did not complete during deployment.');
    console.error('Check that the build command ran successfully in the deployment logs.');
    res.status(500).send('Frontend build files not found. Please check deployment logs.');
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 500MB' });
    }
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  res.status(500).json({ error: 'Internal server error: ' + err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
