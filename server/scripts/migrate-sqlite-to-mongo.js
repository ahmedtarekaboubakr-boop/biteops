import sqlite3 from "sqlite3";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
dotenv.config();
// Import models after mongoose - they will register with mongoose
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQLITE_PATH =
  process.env.SQLITE_PATH || join(__dirname, "..", "database.db");
const MONGODB_URI =
  "mongodb+srv://a100amin:a100amin@academy-manager.5jhedgp.mongodb.net/bite-ops?retryWrites=true&w=majority&appName=bite-ops";
const DROP_EXISTING = process.argv.includes("--drop");

// Helper to promisify SQLite operations
const dbAll = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Helper to safely parse dates from SQLite (handles null, invalid format)
function parseDate(val, fallback = null) {
  if (!val) return fallback ?? new Date();
  const d = new Date(val);
  return isNaN(d.getTime()) ? (fallback ?? new Date()) : d;
}

function normalizeEnum(value, allowedValues, defaultVal) {
  if (!value) return defaultVal;
  const normalized = String(value).toLowerCase().trim().replace(/\s+/g, "_");
  return allowedValues.includes(normalized) ? normalized : defaultVal;
}

async function migrate() {
  console.log("Starting migration from SQLite to MongoDB...");
  console.log(`SQLite DB: ${SQLITE_PATH}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);

  // Connect to MongoDB first
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Import models (must be after mongoose.connect for models to work)
  const {
    User,
    Branch,
    Schedule,
    ScheduleSubmission,
    HrNotification,
    ActivityLog,
    Checklist,
    Rating,
    Tutorial,
    StaffLeaveBalance,
    LeaveRequest,
    FingerprintLog,
    AttendanceRecord,
    Penalty,
    EmploymentHistory,
    InventoryItem,
    InventoryTransaction,
    SpotCheck,
    MaintenanceItem,
    Announcement,
    AnnouncementView,
    FinancialTransaction,
  } = await import("../models/index.js");
  const models = {
    User,
    Branch,
    Schedule,
    ScheduleSubmission,
    HrNotification,
    ActivityLog,
    Checklist,
    Rating,
    Tutorial,
    StaffLeaveBalance,
    LeaveRequest,
    FingerprintLog,
    AttendanceRecord,
    Penalty,
    EmploymentHistory,
    InventoryItem,
    InventoryTransaction,
    SpotCheck,
    MaintenanceItem,
    Announcement,
    AnnouncementView,
    FinancialTransaction,
  };

  // Open SQLite database
  const db = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error("Error opening SQLite database:", err);
      process.exit(1);
    }
  });

  try {
    if (DROP_EXISTING) {
      console.log("Dropping existing collections...");
      await mongoose.connection.dropDatabase();
      console.log("Database dropped.");
    }

    // ID mapping objects
    const userIdMap = {};
    const branchIdMap = {};
    const inventoryItemIdMap = {};
    const announcementIdMap = {};

    // 1. Migrate Users
    console.log("\nMigrating users...");
    const users = await dbAll(db, "SELECT * FROM users");
    for (const user of users) {
      const existing = await models.User.findOne({ username: user.username });
      if (existing) {
        userIdMap[user.id] = existing._id;
        continue;
      }
      const newUser = await models.User.create({
        name: user.name,
        username: user.username,
        email: user.email || `user-${user.id}@migrated.local`,
        password: user.password,
        role: user.role,
        employee_code: user.employee_code,
        date_of_birth: user.date_of_birth,
        start_date: user.start_date,
        payroll_info: user.payroll_info,
        main_focus_area: user.main_focus_area,
        shift: user.shift,
        branch: user.branch,
        status: user.status,
        photo: user.photo,
        salary: user.salary,
        health_certificate: user.health_certificate,
        area: user.area,
        title: user.title,
        phone_number: user.phone_number,
        id_number: user.id_number,
        created_at: parseDate(user.created_at),
      });
      userIdMap[user.id] = newUser._id;
    }
    console.log(`Migrated ${users.length} users`);

    // 2. Migrate Branches
    console.log("\nMigrating branches...");
    const branches = await dbAll(db, "SELECT * FROM branches");
    for (const branch of branches) {
      const newBranch = await models.Branch.create({
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        manager_id: branch.manager_id ? userIdMap[branch.manager_id] : null,
        area: branch.area,
        created_at: parseDate(branch.created_at),
        updated_at: parseDate(branch.updated_at, new Date()),
      });
      branchIdMap[branch.id] = newBranch._id;
    }
    console.log(`Migrated ${branches.length} branches`);

    // 3. Migrate Inventory Items
    console.log("\nMigrating inventory items...");
    const inventoryItems = await dbAll(db, "SELECT * FROM inventory_items");
    for (const item of inventoryItems) {
      const newItem = await models.InventoryItem.create({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        min_level: item.min_level,
        branch: item.branch,
        created_at: parseDate(item.created_at),
        updated_at: parseDate(item.updated_at, new Date()),
      });
      inventoryItemIdMap[item.id] = newItem._id;
    }
    console.log(`Migrated ${inventoryItems.length} inventory items`);

    // 4. Migrate Schedules
    console.log("\nMigrating schedules...");
    const schedules = await dbAll(db, "SELECT * FROM schedules");
    for (const schedule of schedules) {
      const staffId = userIdMap[schedule.staff_id];
      if (!staffId) continue; // Skip orphaned references
      await models.Schedule.create({
        staff_id: staffId,
        date: schedule.date,
        shift: normalizeEnum(schedule.shift, ["morning", "middle", "night"], "morning"),
        branch: schedule.branch,
        station: schedule.station,
        created_at: parseDate(schedule.created_at),
      });
    }
    console.log(`Migrated ${schedules.length} schedules`);

    // 5. Migrate Schedule Submissions
    console.log("\nMigrating schedule submissions...");
    const submissions = await dbAll(db, "SELECT * FROM schedule_submissions");
    let submissionsMigrated = 0;
    let submissionsSkipped = 0;
    for (const submission of submissions) {
      const managerId = userIdMap[submission.manager_id];
      if (!managerId) {
        submissionsSkipped++;
        continue; // Skip if manager was not migrated (e.g. deleted user or null in SQLite)
      }
      await models.ScheduleSubmission.create({
        branch: submission.branch,
        week_start: submission.week_start,
        week_end: submission.week_end,
        manager_id: managerId,
        status: submission.status,
        submitted_at: parseDate(submission.submitted_at),
        last_edited_at: submission.last_edited_at ? parseDate(submission.last_edited_at) : null,
      });
      submissionsMigrated++;
    }
    console.log(`Migrated ${submissionsMigrated} schedule submissions` + (submissionsSkipped > 0 ? ` (skipped ${submissionsSkipped} with missing manager)` : ""));

    // 6. Migrate HR Notifications
    console.log("\nMigrating HR notifications...");
    const notifications = await dbAll(db, "SELECT * FROM hr_notifications");
    for (const notification of notifications) {
      await models.HrNotification.create({
        type: notification.type,
        message: notification.message,
        branch: notification.branch,
        manager_id: notification.manager_id
          ? userIdMap[notification.manager_id]
          : null,
        is_read: notification.is_read,
        created_at: parseDate(notification.created_at),
      });
    }
    console.log(`Migrated ${notifications.length} HR notifications`);

    // 7. Migrate Activity Log
    console.log("\nMigrating activity log...");
    const activityLogs = await dbAll(db, "SELECT * FROM activity_log");
    let activityLogsMigrated = 0;
    let activityLogsSkipped = 0;
    for (const log of activityLogs) {
      const userId = userIdMap[log.user_id];
      if (!userId) {
        activityLogsSkipped++;
        continue;
      }
      await models.ActivityLog.create({
        user_id: userId,
        user_name: log.user_name,
        user_role: log.user_role,
        action_type: log.action_type,
        action_description: log.action_description,
        branch: log.branch,
        details: log.details,
        created_at: parseDate(log.created_at),
      });
      activityLogsMigrated++;
    }
    console.log(`Migrated ${activityLogsMigrated} activity log entries` + (activityLogsSkipped > 0 ? ` (skipped ${activityLogsSkipped} with missing user)` : ""));

    // 8. Migrate Checklists
    console.log("\nMigrating checklists...");
    const checklists = await dbAll(db, "SELECT * FROM checklists");
    let checklistsMigrated = 0;
    let checklistsSkipped = 0;
    for (const checklist of checklists) {
      const managerId = userIdMap[checklist.manager_id];
      if (!managerId) {
        checklistsSkipped++;
        continue;
      }
      const checklistShift = normalizeEnum(checklist.shift, ["morning", "night"], "morning");
      await models.Checklist.create({
        date: checklist.date,
        shift: checklistShift,
        item_id: checklist.item_id,
        completed: checklist.completed,
        branch: checklist.branch,
        manager_id: managerId,
        created_at: parseDate(checklist.created_at),
        updated_at: parseDate(checklist.updated_at, new Date()),
      });
      checklistsMigrated++;
    }
    console.log(`Migrated ${checklistsMigrated} checklists` + (checklistsSkipped > 0 ? ` (skipped ${checklistsSkipped} with missing manager)` : ""));

    // 9. Migrate Ratings
    console.log("\nMigrating ratings...");
    const ratings = await dbAll(db, "SELECT * FROM ratings");
    let ratingsMigrated = 0;
    let ratingsSkipped = 0;
    for (const rating of ratings) {
      const staffId = userIdMap[rating.staff_id];
      const managerId = userIdMap[rating.manager_id];
      if (!staffId || !managerId) {
        ratingsSkipped++;
        continue;
      }
      await models.Rating.create({
        staff_id: staffId,
        date: rating.date,
        manager_id: managerId,
        nails_cut: rating.nails_cut,
        beard_shaved: rating.beard_shaved,
        clean_tshirt: rating.clean_tshirt,
        black_pants: rating.black_pants,
        correct_footwear: rating.correct_footwear,
        performance: rating.performance,
        total_score: rating.total_score,
        notes: rating.notes,
        branch: rating.branch,
        created_at: parseDate(rating.created_at),
        updated_at: parseDate(rating.updated_at, new Date()),
      });
      ratingsMigrated++;
    }
    console.log(`Migrated ${ratingsMigrated} ratings` + (ratingsSkipped > 0 ? ` (skipped ${ratingsSkipped} with missing staff/manager)` : ""));

    // 10. Migrate Tutorials
    console.log("\nMigrating tutorials...");
    const tutorials = await dbAll(db, "SELECT * FROM tutorials");
    let tutorialsMigrated = 0;
    let tutorialsSkipped = 0;
    for (const tutorial of tutorials) {
      const uploadedById = userIdMap[tutorial.uploaded_by];
      if (!uploadedById) {
        tutorialsSkipped++;
        continue;
      }
      await models.Tutorial.create({
        title: tutorial.title,
        description: tutorial.description,
        filename: tutorial.filename,
        file_path: tutorial.file_path,
        file_size: tutorial.file_size,
        uploaded_by: uploadedById,
        created_at: parseDate(tutorial.created_at),
      });
      tutorialsMigrated++;
    }
    console.log(`Migrated ${tutorialsMigrated} tutorials` + (tutorialsSkipped > 0 ? ` (skipped ${tutorialsSkipped} with missing uploaded_by)` : ""));

    // 11. Migrate Staff Leave Balances
    console.log("\nMigrating staff leave balances...");
    const leaveBalances = await dbAll(db, "SELECT * FROM staff_leave_balances");
    let leaveBalancesMigrated = 0;
    let leaveBalancesSkipped = 0;
    for (const balance of leaveBalances) {
      const staffId = userIdMap[balance.staff_id];
      if (!staffId) {
        leaveBalancesSkipped++;
        continue;
      }
      await models.StaffLeaveBalance.create({
        staff_id: staffId,
        total_leave_days: balance.total_leave_days,
        used_leave_days: balance.used_leave_days,
        remaining_leave_days: balance.remaining_leave_days,
        updated_at: parseDate(balance.updated_at, new Date()),
      });
      leaveBalancesMigrated++;
    }
    console.log(`Migrated ${leaveBalancesMigrated} staff leave balances` + (leaveBalancesSkipped > 0 ? ` (skipped ${leaveBalancesSkipped} with missing staff)` : ""));

    // 12. Migrate Leave Requests
    console.log("\nMigrating leave requests...");
    const leaveRequests = await dbAll(db, "SELECT * FROM leave_requests");
    let leaveRequestsMigrated = 0;
    let leaveRequestsSkipped = 0;
    for (const request of leaveRequests) {
      const staffId = userIdMap[request.staff_id];
      if (!staffId) {
        leaveRequestsSkipped++;
        continue;
      }
      await models.LeaveRequest.create({
        staff_id: staffId,
        request_type: request.request_type,
        start_date: request.start_date,
        end_date: request.end_date,
        number_of_days: request.number_of_days,
        reason: request.reason,
        status: request.status,
        manager_id: request.manager_id ? userIdMap[request.manager_id] : null,
        branch: request.branch,
        area_manager_status: request.area_manager_status,
        area_manager_id: request.area_manager_id
          ? userIdMap[request.area_manager_id]
          : null,
        area_manager_updated_at: request.area_manager_updated_at ? parseDate(request.area_manager_updated_at) : null,
        operations_manager_status: request.operations_manager_status,
        operations_manager_id: request.operations_manager_id
          ? userIdMap[request.operations_manager_id]
          : null,
        operations_manager_updated_at: request.operations_manager_updated_at ? parseDate(request.operations_manager_updated_at) : null,
        hr_status: request.hr_status,
        hr_manager_id: request.hr_manager_id
          ? userIdMap[request.hr_manager_id]
          : null,
        hr_updated_at: request.hr_updated_at ? parseDate(request.hr_updated_at) : null,
        created_at: parseDate(request.created_at),
        updated_at: parseDate(request.updated_at, new Date()),
      });
      leaveRequestsMigrated++;
    }
    console.log(`Migrated ${leaveRequestsMigrated} leave requests` + (leaveRequestsSkipped > 0 ? ` (skipped ${leaveRequestsSkipped} with missing staff)` : ""));

    // 13. Migrate Fingerprint Logs
    console.log("\nMigrating fingerprint logs...");
    const fingerprintLogs = await dbAll(db, "SELECT * FROM fingerprint_logs");
    let fingerprintLogsMigrated = 0;
    let fingerprintLogsSkipped = 0;
    for (const log of fingerprintLogs) {
      const staffId = userIdMap[log.staff_id];
      if (!staffId) {
        fingerprintLogsSkipped++;
        continue;
      }
      await models.FingerprintLog.create({
        staff_id: staffId,
        scan_time: parseDate(log.scan_time),
        scan_type: log.scan_type,
        fingerprint_data: log.fingerprint_data,
        device_id: log.device_id,
        branch: log.branch,
        created_at: parseDate(log.created_at),
      });
      fingerprintLogsMigrated++;
    }
    console.log(`Migrated ${fingerprintLogsMigrated} fingerprint logs` + (fingerprintLogsSkipped > 0 ? ` (skipped ${fingerprintLogsSkipped} with missing staff)` : ""));

    // 14. Migrate Attendance Records
    console.log("\nMigrating attendance records...");
    const attendanceRecords = await dbAll(
      db,
      "SELECT * FROM attendance_records"
    );
    let attendanceRecordsMigrated = 0;
    let attendanceRecordsSkipped = 0;
    for (const record of attendanceRecords) {
      const staffId = userIdMap[record.staff_id];
      if (!staffId) {
        attendanceRecordsSkipped++;
        continue;
      }
      await models.AttendanceRecord.create({
        staff_id: staffId,
        date: record.date,
        shift: normalizeEnum(record.shift, ["morning", "middle", "night"], "morning"),
        scheduled_start_time: record.scheduled_start_time,
        scheduled_end_time: record.scheduled_end_time,
        clock_in_time: record.clock_in_time ? parseDate(record.clock_in_time) : null,
        clock_out_time: record.clock_out_time ? parseDate(record.clock_out_time) : null,
        late_minutes: record.late_minutes,
        early_leave_minutes: record.early_leave_minutes,
        overtime_minutes: record.overtime_minutes,
        status: normalizeEnum(record.status, ["present", "absent", "late", "half_day", "on_leave"], "present"),
        branch: record.branch,
        notes: record.notes,
        created_at: parseDate(record.created_at),
        updated_at: parseDate(record.updated_at, new Date()),
      });
      attendanceRecordsMigrated++;
    }
    console.log(`Migrated ${attendanceRecordsMigrated} attendance records` + (attendanceRecordsSkipped > 0 ? ` (skipped ${attendanceRecordsSkipped} with missing staff)` : ""));

    // 15. Migrate Penalties
    console.log("\nMigrating penalties...");
    const penalties = await dbAll(db, "SELECT * FROM penalties");
    let penaltiesMigrated = 0;
    let penaltiesSkipped = 0;
    for (const penalty of penalties) {
      const staffId = userIdMap[penalty.staff_id];
      const managerId = userIdMap[penalty.manager_id];
      if (!staffId || !managerId) {
        penaltiesSkipped++;
        continue;
      }
      await models.Penalty.create({
        staff_id: staffId,
        date: penalty.date,
        penalty_type: penalty.penalty_type,
        misconduct_description: penalty.misconduct_description,
        penalty_amount: penalty.penalty_amount,
        penalty_details: penalty.penalty_details,
        manager_id: managerId,
        branch: penalty.branch,
        status: normalizeEnum(penalty.status, ["active", "resolved", "cancelled"], "active"),
        created_at: parseDate(penalty.created_at),
        updated_at: parseDate(penalty.updated_at, new Date()),
      });
      penaltiesMigrated++;
    }
    console.log(`Migrated ${penaltiesMigrated} penalties` + (penaltiesSkipped > 0 ? ` (skipped ${penaltiesSkipped} with missing staff/manager)` : ""));

    // 16. Migrate Employment History
    console.log("\nMigrating employment history...");
    const employmentHistory = await dbAll(
      db,
      "SELECT * FROM employment_history"
    );
    let employmentHistoryMigrated = 0;
    let employmentHistorySkipped = 0;
    for (const history of employmentHistory) {
      const staffId = userIdMap[history.staff_id];
      if (!staffId) {
        employmentHistorySkipped++;
        continue;
      }
      await models.EmploymentHistory.create({
        staff_id: staffId,
        previous_title: history.previous_title,
        new_title: history.new_title,
        change_date: history.change_date,
        change_type: history.change_type,
        notes: history.notes,
        changed_by: history.changed_by ? userIdMap[history.changed_by] : null,
        created_at: parseDate(history.created_at),
      });
      employmentHistoryMigrated++;
    }
    console.log(
      `Migrated ${employmentHistoryMigrated} employment history records` + (employmentHistorySkipped > 0 ? ` (skipped ${employmentHistorySkipped} with missing staff)` : "")
    );

    // 17. Migrate Inventory Transactions
    console.log("\nMigrating inventory transactions...");
    const inventoryTransactions = await dbAll(
      db,
      "SELECT * FROM inventory_transactions"
    );
    let inventoryTransactionsMigrated = 0;
    let inventoryTransactionsSkipped = 0;
    for (const transaction of inventoryTransactions) {
      const itemId = inventoryItemIdMap[transaction.item_id];
      const recordedById = userIdMap[transaction.recorded_by];
      if (!itemId || !recordedById) {
        inventoryTransactionsSkipped++;
        continue;
      }
      await models.InventoryTransaction.create({
        item_id: itemId,
        type: normalizeEnum(transaction.type, ["receive", "transfer", "waste", "dispose", "adjustment"], "adjustment"),
        quantity: transaction.quantity,
        to_branch: transaction.to_branch,
        reason: transaction.reason,
        notes: transaction.notes,
        recorded_by: recordedById,
        branch: transaction.branch,
        status: transaction.status,
        created_at: parseDate(transaction.created_at),
      });
      inventoryTransactionsMigrated++;
    }
    console.log(
      `Migrated ${inventoryTransactionsMigrated} inventory transactions` + (inventoryTransactionsSkipped > 0 ? ` (skipped ${inventoryTransactionsSkipped} with missing item/recorded_by)` : "")
    );

    // 18. Migrate Spot Checks
    console.log("\nMigrating spot checks...");
    const spotChecks = await dbAll(db, "SELECT * FROM spot_checks");
    let spotChecksMigrated = 0;
    let spotChecksSkipped = 0;
    for (const check of spotChecks) {
      const managerId = userIdMap[check.manager_id];
      if (!managerId) {
        spotChecksSkipped++;
        continue;
      }
      await models.SpotCheck.create({
        date: check.date,
        branch: check.branch,
        manager_id: managerId,
        check_type: normalizeEnum(check.check_type, ["start_of_day", "end_of_day"], "start_of_day"),
        category: normalizeEnum(check.category, ["proteins", "beverages"], "proteins"),
        item_name: check.item_name,
        quantity: check.quantity,
        unit: check.unit,
        notes: check.notes,
        created_at: parseDate(check.created_at),
      });
      spotChecksMigrated++;
    }
    console.log(`Migrated ${spotChecksMigrated} spot checks` + (spotChecksSkipped > 0 ? ` (skipped ${spotChecksSkipped} with missing manager)` : ""));

    // 19. Migrate Maintenance Items
    console.log("\nMigrating maintenance items...");
    const maintenanceItems = await dbAll(db, "SELECT * FROM maintenance_items");
    const MAINTENANCE_CATEGORIES = ["machinery", "cleaning_supplies", "electronics", "supplies", "furniture"];
    const MAINTENANCE_STATUSES = ["active", "needs_repair", "out_of_order", "disposed"];
    let maintenanceItemsMigrated = 0;
    let maintenanceItemsSkipped = 0;
    for (const item of maintenanceItems) {
      const name = (item.name ?? item.item_name ?? "").trim();
      const branch = (item.branch ?? item.branch_name ?? item.location ?? "").trim();
      if (!name || !branch) {
        maintenanceItemsSkipped++;
        continue;
      }
      await models.MaintenanceItem.create({
        name,
        category: normalizeEnum(item.category, MAINTENANCE_CATEGORIES, "supplies"),
        description: item.description,
        quantity: item.quantity,
        branch,
        status: normalizeEnum(item.status, MAINTENANCE_STATUSES, "active"),
        notes: item.notes,
        created_at: parseDate(item.created_at),
        updated_at: parseDate(item.updated_at, new Date()),
      });
      maintenanceItemsMigrated++;
    }
    console.log(`Migrated ${maintenanceItemsMigrated} maintenance items` + (maintenanceItemsSkipped > 0 ? ` (skipped ${maintenanceItemsSkipped} with missing name/branch)` : ""));

    // 20. Migrate Announcements
    console.log("\nMigrating announcements...");
    const announcements = await dbAll(db, "SELECT * FROM announcements");
    let announcementsMigrated = 0;
    let announcementsSkipped = 0;
    for (const announcement of announcements) {
      const createdById = userIdMap[announcement.created_by];
      if (!createdById) {
        announcementsSkipped++;
        continue;
      }
      const newAnnouncement = await models.Announcement.create({
        title: announcement.title,
        message: announcement.message,
        created_by: createdById,
        target_roles: announcement.target_roles,
        target_branches: announcement.target_branches,
        target_staff_ids: announcement.target_staff_ids,
        created_at: parseDate(announcement.created_at),
      });
      announcementIdMap[announcement.id] = newAnnouncement._id;
      announcementsMigrated++;
    }
    console.log(`Migrated ${announcementsMigrated} announcements` + (announcementsSkipped > 0 ? ` (skipped ${announcementsSkipped} with missing created_by)` : ""));

    // 21. Migrate Announcement Views
    console.log("\nMigrating announcement views...");
    const announcementViews = await dbAll(
      db,
      "SELECT * FROM announcement_views"
    );
    let announcementViewsMigrated = 0;
    let announcementViewsSkipped = 0;
    for (const view of announcementViews) {
      const announcementId = announcementIdMap[view.announcement_id];
      const userId = userIdMap[view.user_id];
      if (!announcementId || !userId) {
        announcementViewsSkipped++;
        continue;
      }
      await models.AnnouncementView.create({
        announcement_id: announcementId,
        user_id: userId,
        dismissed: view.dismissed,
        viewed_at: parseDate(view.viewed_at),
      });
      announcementViewsMigrated++;
    }
    console.log(`Migrated ${announcementViewsMigrated} announcement views` + (announcementViewsSkipped > 0 ? ` (skipped ${announcementViewsSkipped} with missing announcement/user)` : ""));

    // 22. Migrate Financial Transactions
    console.log("\nMigrating financial transactions...");
    const financialTransactions = await dbAll(
      db,
      "SELECT * FROM financial_transactions"
    );
    let financialTransactionsMigrated = 0;
    let financialTransactionsSkipped = 0;
    for (const transaction of financialTransactions) {
      const recordedById = userIdMap[transaction.recorded_by];
      if (!recordedById) {
        financialTransactionsSkipped++;
        continue;
      }
      await models.FinancialTransaction.create({
        type: normalizeEnum(transaction.type, ["revenue_cash", "revenue_card", "petty_cash", "fine", "deposit", "void", "complimentary"], "void"),
        amount: transaction.amount,
        reference: transaction.reference,
        description: transaction.description,
        recorded_by: recordedById,
        branch: transaction.branch,
        created_at: parseDate(transaction.created_at),
      });
      financialTransactionsMigrated++;
    }
    console.log(
      `Migrated ${financialTransactionsMigrated} financial transactions` + (financialTransactionsSkipped > 0 ? ` (skipped ${financialTransactionsSkipped} with missing recorded_by)` : "")
    );

    // Create default owner if none exists
    const owner = await models.User.findOne({ role: "owner" });
    if (!owner) {
      const defaultPassword = bcrypt.hashSync("admin123", 10);
      await models.User.create({
        name: "Owner",
        email: "owner@jjs.com",
        username: "owner",
        password: defaultPassword,
        role: "owner",
      });
      console.log("\nDefault owner account created: owner@jjs.com / admin123");
    }

    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run migration
migrate();
