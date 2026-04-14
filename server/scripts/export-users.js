/**
 * Export all users to a CSV file: name, email, username, role.
 * Passwords are stored hashed in the database and cannot be exported in plain text.
 */
import mongoose from "mongoose";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", "..", ".env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/biteops";
const OUT_PATH = process.env.USERS_EXPORT_PATH || join(__dirname, "..", "..", "users-list.csv");

async function exportUsers() {
  await mongoose.connect(MONGODB_URI);
  const { User } = await import("../models/index.js");

  const users = await User.find({}).select("name email username role").lean().sort({ role: 1, name: 1 });

  const header = "Name,Email,Username,Role,Password\n";
  const rows = users.map((u) => {
    const name = escapeCsv(u.name || "");
    const email = escapeCsv(u.email || "");
    const username = escapeCsv(u.username || "");
    const role = escapeCsv(u.role || "");
    const password = "(stored hashed in database - use app login or reset)";
    return `${name},${email},${username},${role},${password}`;
  });

  const csv = header + rows.join("\n");
  writeFileSync(OUT_PATH, csv, "utf8");

  console.log(`Exported ${users.length} users to ${OUT_PATH}`);
  await mongoose.disconnect();
  process.exit(0);
}

function escapeCsv(val) {
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

exportUsers().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
