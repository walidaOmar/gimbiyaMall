/**
 * MongoDB connection + startup seed
 *
 * ── Default Staff Login Credentials ─────────────────────────────────────────
 *
 *  Role          │ Email                       │ Password
 * ─────────────────────────────────────────────────────────────────────────────
 *  admin         │ admin@sahadstores.com        │ Admin@123456
 *  manager       │ manager@sahadstores.com      │ Manager@123456
 *  stock_manager │ stock@sahadstores.com        │ Stock@123456
 *  delivery      │ delivery@sahadstores.com     │ Delivery@123456
 *  developer     │ developer@sahadstores.com    │ Developer@123456
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Buyers register themselves at /auth.
 * Affiliate (reader) role is granted by an Admin via User Management.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { seedVirtualMall } from "./seedVirtualMall";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn("[MongoDB] MONGODB_URI not set — database features disabled");
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || "gimbiya_mall",
    });
    isConnected = true;
    console.log("[MongoDB] Connected successfully");

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] Connection error:", err);
      isConnected = false;
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Disconnected");
      isConnected = false;
    });

    await seedStaffAccounts();
    await seedVirtualMall();
  } catch (error) {
    console.error("[MongoDB] Failed to connect:", error);
  }
}

async function seedStaffAccounts() {
  const { User } = await import("./models/User");

  const staff = [
    { name: "Admin User",      email: "admin@sahadstores.com",    password: "Admin@123456",    role: "admin"         as const },
    { name: "Manager User",    email: "manager@sahadstores.com",  password: "Manager@123456",  role: "manager"       as const },
    { name: "Stock Manager",   email: "stock@sahadstores.com",    password: "Stock@123456",    role: "stock_manager" as const },
    { name: "Delivery Rider",  email: "delivery@sahadstores.com", password: "Delivery@123456", role: "delivery"      as const },
    { name: "Developer User",  email: "developer@sahadstores.com",password: "Developer@123456",role: "developer"     as const },
  ];

  for (const s of staff) {
    const exists = await User.findOne({ email: s.email });
    if (!exists) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(s.password, salt);
      await User.create({ name: s.name, email: s.email, passwordHash, role: s.role, isActive: true });
      console.log(`[Seed] Created ${s.role} → ${s.email}`);
    }
  }
}

export function getIsConnected(): boolean {
  return isConnected;
}
