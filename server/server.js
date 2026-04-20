import "./loadEnv.js";
import express from "express";
import cors from "cors";
import multer from "multer";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('==========================================');
console.log('SERVER STARTUP - Environment Check');
console.log('==========================================');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || '5000');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET ✓' : 'NOT SET ✗');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✓' : 'NOT SET ✗');
console.log('__dirname:', __dirname);
console.log('==========================================');
console.log('');

if (!process.env.MONGODB_URI) {
  console.error('❌ CRITICAL ERROR: MONGODB_URI is not set!');
  console.error('Server cannot start without database connection.');
  console.error('Please set MONGODB_URI in your environment variables.');
}

if (!process.env.JWT_SECRET) {
  console.error('⚠️  WARNING: JWT_SECRET is not set!');
  console.error('Using a default secret (NOT SECURE FOR PRODUCTION)');
  process.env.JWT_SECRET = 'fallback-secret-key-change-in-production';
}

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// STEP 1: HEALTH CHECK ROUTES (BEFORE ANYTHING ELSE)
// ======================
app.get('/', (req, res) => {
  res.json({ 
    status: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: [
      'Staff Management',
      'Inventory & Assets',
      'Transactions & KPIs',
      'Dashboard Analytics',
      'Incident Reports',
      'Shift Swaps',
      'Onboarding',
      'Prep Checklists'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    mongodb: 'connected'
  });
});

// ======================
// STEP 2: MIDDLEWARE
// ======================
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

console.log('Setting up CORS...');
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
console.log('✓ CORS configured');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = join(__dirname, 'uploads');
if (existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
  console.log('✓ Uploads directory configured');
} else {
  console.log('⚠️  Uploads directory not found (will be created on first upload)');
}

const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('✓ Static files directory (dist) configured');
} else {
  console.log('⚠️  WARNING: dist directory not found!');
  console.log('Frontend will not be served. API-only mode.');
}

// ======================
// STEP 3: INITIALIZE DATABASE & LOAD ROUTES
// ======================
let dbConnected = false;

async function initializeApp() {
  try {
    console.log('');
    console.log('==========================================');
    console.log('DATABASE & ROUTES INITIALIZATION');
    console.log('==========================================');
    
    // Import database (connects to MongoDB)
    console.log('Connecting to database...');
    await import('./db.js');
    await import('./uploads.js');
    dbConnected = true;
    console.log('✓ Database module loaded');
    
    // Import all routes
    console.log('Loading API routes...');
    const authRoutes = await import('./routes/authRoutes.js');
    const managersRoutes = await import('./routes/managersRoutes.js');
    const staffRoutes = await import('./routes/staffRoutes.js');
    const scheduleRoutes = await import('./routes/scheduleRoutes.js');
    const notificationsRoutes = await import('./routes/notificationsRoutes.js');
    const ratingsRoutes = await import('./routes/ratingsRoutes.js');
    const announcementsRoutes = await import('./routes/announcementsRoutes.js');
    const tutorialsRoutes = await import('./routes/tutorialsRoutes.js');
    const activityLogRoutes = await import('./routes/activityLogRoutes.js');
    const leaveRequestsRoutes = await import('./routes/leaveRequestsRoutes.js');
    const attendanceRoutes = await import('./routes/attendanceRoutes.js');
    const penaltiesRoutes = await import('./routes/penaltiesRoutes.js');
    const checklistsRoutes = await import('./routes/checklistsRoutes.js');
    const inventoryRoutes = await import('./routes/inventoryRoutes.js');
    const transactionsRoutes = await import('./routes/transactionsRoutes.js');
    const branchesRoutes = await import('./routes/branchesRoutes.js');
    const branchManagersRoutes = await import('./routes/branchManagersRoutes.js');
    const leaderboardRoutes = await import('./routes/leaderboardRoutes.js');
    const maintenanceRoutes = await import('./routes/maintenanceRoutes.js');
    const tabletRoutes = await import('./routes/tabletRoutes.js');
    const dashboardRoutes = await import('./routes/dashboardRoutes.js');
    const reportsRoutes = await import('./routes/reportsRoutes.js');
    const shiftSwapRoutes = await import('./routes/shiftSwapRoutes.js');
    const incidentRoutes = await import('./routes/incidentRoutes.js');
    const assetRoutes = await import('./routes/assetRoutes.js');
    const prepChecklistRoutes = await import('./routes/prepChecklistRoutes.js');
    const onboardingRoutes = await import('./routes/onboardingRoutes.js');
    
    // Register routes
    app.use('/api/auth', authRoutes.default);
    app.use('/api/managers', managersRoutes.default);
    app.use('/api/staff', staffRoutes.default);
    app.use('/api/schedules', scheduleRoutes.default);
    app.use('/api/notifications', notificationsRoutes.default);
    app.use('/api/ratings', ratingsRoutes.default);
    app.use('/api/announcements', announcementsRoutes.default);
    app.use('/api/tutorials', tutorialsRoutes.default);
    app.use('/api/activity-log', activityLogRoutes.default);
    app.use('/api/leave-requests', leaveRequestsRoutes.default);
    app.use('/api/attendance', attendanceRoutes.default);
    app.use('/api/penalties', penaltiesRoutes.default);
    app.use('/api/checklists', checklistsRoutes.default);
    app.use('/api/inventory', inventoryRoutes.default);
    app.use('/api/transactions', transactionsRoutes.default);
    app.use('/api/branches', branchesRoutes.default);
    app.use('/api/branch-managers', branchManagersRoutes.default);
    app.use('/api/leaderboard', leaderboardRoutes.default);
    app.use('/api/maintenance', maintenanceRoutes.default);
    app.use('/api/tablet', tabletRoutes.default);
    app.use('/api/dashboard', dashboardRoutes.default);
    app.use('/api/reports', reportsRoutes.default);
    app.use('/api/shift-swaps', shiftSwapRoutes.default);
    app.use('/api/incidents', incidentRoutes.default);
    app.use('/api/assets', assetRoutes.default);
    app.use('/api/prep-checklists', prepChecklistRoutes.default);
    app.use('/api/onboarding', onboardingRoutes.default);
    
    console.log('✓ All API routes loaded successfully');
    console.log('==========================================');
    console.log('');
    
    // ======================
    // STEP 4: CATCH-ALL FOR SPA (Must be after API routes!)
    // ======================
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      const indexPath = join(__dirname, 'dist', 'index.html');
      if (existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.log('⚠️  Request to', req.path, '- dist/index.html not found');
        res.status(404).send('Frontend not available. API is running at /api/*');
      }
    });
    
  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    console.error('Stack:', error.stack);
    console.error('Some features may not work correctly.');
  }
}

// ======================
// STEP 5: ERROR HANDLING
// ======================
app.use((err, req, res, next) => {
  console.error('==========================================');
  console.error('UNHANDLED ERROR:');
  console.error('==========================================');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('==========================================');
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 500MB' });
    }
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('==========================================');
  console.error('UNHANDLED PROMISE REJECTION:');
  console.error('==========================================');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('==========================================');
});

process.on('uncaughtException', (error) => {
  console.error('==========================================');
  console.error('UNCAUGHT EXCEPTION:');
  console.error('==========================================');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('==========================================');
  process.exit(1);
});

// ======================
// STEP 6: START SERVER
// ======================
async function startServer() {
  try {
    await initializeApp();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('==========================================');
      console.log('✅ SERVER STARTED SUCCESSFULLY');
      console.log('==========================================');
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${dbConnected ? 'Connected ✓' : 'Not Connected ✗'}`);
      console.log(`Health check: http://localhost:${PORT}/`);
      console.log(`API endpoints: http://localhost:${PORT}/api/*`);
      console.log('==========================================');
      console.log('');
    });
  } catch (error) {
    console.error('==========================================');
    console.error('❌ FATAL ERROR - Server failed to start');
    console.error('==========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('==========================================');
    process.exit(1);
  }
}

startServer().catch(error => {
  console.error('Fatal error in startServer:', error);
  process.exit(1);
});
