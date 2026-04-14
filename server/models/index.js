import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";
import User from "./User.js";
import Branch from "./Branch.js";
import Schedule from "./Schedule.js";
import ScheduleSubmission from "./ScheduleSubmission.js";
import HrNotification from "./HrNotification.js";
import ActivityLog from "./ActivityLog.js";
import Checklist from "./Checklist.js";
import Rating from "./Rating.js";
import Tutorial from "./Tutorial.js";
import StaffLeaveBalance from "./StaffLeaveBalance.js";
import LeaveRequest from "./LeaveRequest.js";
import FingerprintLog from "./FingerprintLog.js";
import AttendanceRecord from "./AttendanceRecord.js";
import Penalty from "./Penalty.js";
import EmploymentHistory from "./EmploymentHistory.js";
import InventoryItem from "./InventoryItem.js";
import InventoryTransaction from "./InventoryTransaction.js";
import SpotCheck from "./SpotCheck.js";
import MaintenanceItem from "./MaintenanceItem.js";
import Announcement from "./Announcement.js";
import AnnouncementView from "./AnnouncementView.js";
import FinancialTransaction from "./FinancialTransaction.js";

// Load .env from project root (BiteOps/.env)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "..", "..", ".env");
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/biteops";
console.log("MongoDB URI:", MONGODB_URI.substring(0, 30) + "..."); // Show first 30 chars only for security
console.log("Attempting to connect to MongoDB...");

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Create default owner account if it doesn't exist
    try {
      const owner = await User.findOne({ role: "owner" });
      if (!owner) {
        const defaultPassword = bcrypt.hashSync("admin123", 10);
        await User.create({
          name: "Owner",
          email: "owner@jjs.com",
          username: "owner",
          password: defaultPassword,
          role: "owner",
        });
        console.log("Default owner account created: owner@jjs.com / admin123");
      }
    } catch (error) {
      console.error("Error creating default owner:", error);
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

export {
  mongoose,
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
