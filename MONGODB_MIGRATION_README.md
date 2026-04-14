# MongoDB Migration Guide

## Overview
This project has been partially migrated from SQLite to MongoDB using Mongoose. This document provides instructions for completing the migration and running the application.

## What's Been Done

### ✅ Completed
1. **22 Mongoose Models** created in `server/models/`
2. **Migration Script** (`server/scripts/migrate-sqlite-to-mongo.js`) - Migrates all data from SQLite to MongoDB
3. **Core Infrastructure**:
   - `server/db.js` - Now exports Mongoose models
   - `server/models/index.js` - MongoDB connection and model exports
   - `server/utils/activityLogger.js` - Updated to use Mongoose
4. **8 Controllers Converted**:
   - authController
   - notificationsController
   - tutorialsController
   - activityLogController
   - transactionsController
   - checklistsController
   - maintenanceController
   - (tabletController needs conversion)

### ⚠️ Remaining Work
**11 controllers** still need conversion from SQLite to Mongoose:
- managersController
- staffController
- scheduleController
- ratingsController
- announcementsController
- leaveRequestsController
- attendanceController
- penaltiesController
- inventoryController
- branchesController
- leaderboardController
- tabletController

## Prerequisites

1. **MongoDB** installed and running:
   ```bash
   # macOS (with Homebrew)
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Node.js** and npm installed

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
```bash
# Copy the example env file
cp ../.env.example .env

# Edit .env and set your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/biteops
```

### 3. Run Migration (One-Time)
```bash
# Migrate data from SQLite to MongoDB
npm run migrate

# Or with --drop to clear existing MongoDB data first
cd server && npm run migrate -- --drop
```

The migration script will:
- Read all data from `server/database.db`
- Create MongoDB collections
- Map SQLite integer IDs to MongoDB ObjectIds
- Preserve all relationships (foreign keys)
- Create default owner account if needed

### 4. Complete Controller Conversions

Each remaining controller needs to be converted following the pattern in `MONGOOSE_CONVERSION_GUIDE.md`.

**Quick conversion steps for each controller:**

1. Update imports:
   ```javascript
   // Replace
   import { dbGet, dbRun, dbAll } from '../db.js';
   // With
   import { User, Model1, Model2 } from '../db.js';
   ```

2. Convert queries:
   - `dbGet()` → `Model.findOne()` or `Model.findById()`
   - `dbAll()` → `Model.find()`
   - `dbRun(INSERT)` → `Model.create()`
   - `dbRun(UPDATE)` → `Model.findByIdAndUpdate()`
   - `dbRun(DELETE)` → `Model.findByIdAndDelete()`

3. Handle JOINs with `.populate()` or `.aggregate()`

4. Replace `result.lastID` with `doc._id` or `doc.id`

5. Update error handling:
   ```javascript
   // Replace
   if (err.message.includes('UNIQUE constraint'))
   // With
   if (err.code === 11000)
   ```

See `MONGOOSE_CONVERSION_GUIDE.md` for detailed patterns and examples.

### 5. Start the Server
```bash
npm start
# or for development
npm run dev
```

## Testing

### Test Converted Features
1. **Login** - `POST /api/auth/login`
2. **Notifications** - `GET /api/notifications`
3. **Tutorials** - `GET /api/tutorials`
4. **Activity Log** - `GET /api/activity-log`
5. **Transactions** - `GET /api/transactions`
6. **Checklists** - `GET /api/checklists`
7. **Maintenance** - `GET /api/maintenance`

### Test After Converting Remaining Controllers
- Staff management (CRUD)
- Schedule creation and viewing
- Ratings
- Announcements
- Leave requests
- Attendance tracking
- Penalties
- Inventory management
- Branch management
- Leaderboard
- Tablet clock-in/out

## Important Notes

### ID Handling
- SQLite used integer `id` (1, 2, 3...)
- MongoDB uses ObjectId `_id` (e.g., "507f1f77bcf86cd799439011")
- All models have a virtual `id` property that returns `_id.toString()`
- API responses will now have string IDs instead of integers
- The client should handle string IDs (already compatible with URLs and React keys)

### JWT Tokens
- After migration, JWT tokens are generated with string IDs: `user._id.toString()`
- **Existing tokens with integer IDs will stop working**
- Users must re-login after migration

### Data Integrity
- The migration script preserves all relationships
- Foreign keys are mapped from integer IDs to ObjectIds
- All data is migrated in dependency order (users first, then branches, then everything else)

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh
# or
mongo

# Check connection string in .env
cat .env | grep MONGODB_URI
```

### Migration Errors
```bash
# Check SQLite database exists
ls -la server/database.db

# Run migration with verbose output
cd server && npm run migrate
```

### Controller Conversion Errors
- Check import statements match model names
- Verify query syntax (Mongoose uses objects, not SQL strings)
- Check for `await` on all async operations
- Use `.lean()` if you don't need Mongoose document features

## File Structure

```
server/
├── models/
│   ├── User.js
│   ├── Branch.js
│   ├── Schedule.js
│   ├── ... (19 more models)
│   └── index.js (connection + exports)
├── controllers/
│   ├── authController.js (✅ converted)
│   ├── staffController.js (⚠️ needs conversion)
│   └── ... (17 more controllers)
├── db.js (re-exports models)
├── package.json (mongoose added, sqlite3 in devDependencies)
└── database.db (original SQLite - keep for migration)

scripts/
└── migrate-sqlite-to-mongo.js (migration script)

Documentation:
├── MONGOOSE_CONVERSION_GUIDE.md (conversion patterns)
├── MIGRATION_STATUS.md (detailed status)
└── MONGODB_MIGRATION_README.md (this file)
```

## Next Steps

1. **Complete controller conversions** (11 remaining)
2. **Test each converted controller** thoroughly
3. **Run migration** on production/staging data
4. **Update client** if needed (should work with string IDs)
5. **Remove SQLite dependency** from production (keep in devDependencies for migration script)

## Support

- See `MONGOOSE_CONVERSION_GUIDE.md` for conversion patterns
- See `MIGRATION_STATUS.md` for detailed progress
- Check Mongoose docs: https://mongoosejs.com/docs/guide.html
