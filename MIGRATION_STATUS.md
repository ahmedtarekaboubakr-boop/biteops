# MongoDB Migration Status

## Completed ✅

### 1. Mongoose Models (22 models)
All models created in `server/models/`:
- User.js
- Branch.js
- Schedule.js
- ScheduleSubmission.js
- HrNotification.js
- ActivityLog.js
- Checklist.js
- Rating.js
- Tutorial.js
- StaffLeaveBalance.js
- LeaveRequest.js
- FingerprintLog.js
- AttendanceRecord.js
- Penalty.js
- EmploymentHistory.js
- InventoryItem.js
- InventoryTransaction.js
- SpotCheck.js
- MaintenanceItem.js
- Announcement.js
- AnnouncementView.js
- FinancialTransaction.js
- models/index.js (connection + exports)

### 2. Core Files Updated
- ✅ `server/db.js` - Now re-exports Mongoose models
- ✅ `server/utils/activityLogger.js` - Uses ActivityLog model
- ✅ `server/package.json` - Added mongoose, moved sqlite3 to devDependencies, added migrate script

### 3. Controllers Converted (8/19)
- ✅ authController.js
- ✅ notificationsController.js
- ✅ tutorialsController.js
- ✅ activityLogController.js
- ✅ transactionsController.js
- ✅ checklistsController.js
- ✅ maintenanceController.js
- ⚠️ tabletController.js (needs conversion)

### 4. Migration Script
- ✅ `server/scripts/migrate-sqlite-to-mongo.js` - Complete migration script with ID mapping

## Remaining Work ⚠️

### Controllers to Convert (11 remaining)
1. **managersController.js** - User CRUD for managers
2. **staffController.js** - Complex: User CRUD + file uploads + employment history
3. **scheduleController.js** - Complex: JOINs with users, schedule submissions
4. **ratingsController.js** - Staff ratings with aggregations
5. **announcementsController.js** - Announcements + views
6. **leaveRequestsController.js** - Complex approval workflow
7. **attendanceController.js** - Fingerprint logs + attendance records
8. **penaltiesController.js** - Staff penalties
9. **inventoryController.js** - Complex: Items + transactions + transfers
10. **branchesController.js** - Branch management
11. **leaderboardController.js** - Complex aggregations for staff/branch rankings
12. **tabletController.js** - Tablet clock-in/out

## Conversion Pattern for Each Controller

### Step 1: Update Imports
```javascript
// OLD
import { dbGet, dbRun, dbAll } from '../db.js';

// NEW
import { User, Schedule, Rating, /* needed models */ } from '../db.js';
```

### Step 2: Convert Queries

#### Simple Finds
```javascript
// dbGet → findOne/findById
const user = await dbGet("SELECT * FROM users WHERE id = ?", [id]);
// becomes
const user = await User.findById(id);

// dbAll → find
const users = await dbAll("SELECT * FROM users WHERE role = ?", ['staff']);
// becomes
const users = await User.find({ role: 'staff' });
```

#### Inserts
```javascript
// dbRun INSERT → create
const result = await dbRun("INSERT INTO users (...) VALUES (...)", [...]);
const newId = result.lastID;
// becomes
const user = await User.create({ ... });
const newId = user._id; // or user.id
```

#### Updates
```javascript
// dbRun UPDATE → findByIdAndUpdate
await dbRun("UPDATE users SET name = ? WHERE id = ?", [name, id]);
// becomes
await User.findByIdAndUpdate(id, { name });
```

#### Deletes
```javascript
// dbRun DELETE → findByIdAndDelete
await dbRun("DELETE FROM users WHERE id = ?", [id]);
// becomes
await User.findByIdAndDelete(id);
```

#### JOINs
```javascript
// SQL JOIN → populate or aggregate
const schedules = await dbAll(`
  SELECT s.*, u.name as staff_name
  FROM schedules s
  JOIN users u ON s.staff_id = u.id
  WHERE s.branch = ?
`, [branch]);
// becomes
const schedules = await Schedule.find({ branch })
  .populate('staff_id', 'name employee_code');
```

### Step 3: Handle Errors
```javascript
// UNIQUE constraint → duplicate key
if (err.message && err.message.includes('UNIQUE constraint')) {
// becomes
if (err.code === 11000) {
```

## Testing After Conversion

### 1. Run Migration
```bash
cd server
MONGODB_URI=mongodb://localhost:27017/biteops npm run migrate
```

### 2. Start Server
```bash
MONGODB_URI=mongodb://localhost:27017/biteops npm start
```

### 3. Test Critical Flows
- Login (auth)
- Create/list staff
- Create/view schedules
- Clock in/out (tablet)
- View leaderboard
- Create announcements

## Notes
- All models use `id` virtual that returns `_id.toString()`
- JWT tokens now use string IDs: `user._id.toString()`
- Existing SQLite tokens will stop working after migration (users must re-login)
- Migration script handles ID mapping for all foreign keys
- Run migration with `--drop` to clear existing MongoDB data first

## Quick Reference Files
- `MONGOOSE_CONVERSION_GUIDE.md` - Detailed conversion patterns
- `server/scripts/migrate-sqlite-to-mongo.js` - Migration script
- `server/models/index.js` - All model definitions
