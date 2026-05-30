/**
 * StaffRequest.ts  —  Mongoose Model for Staff Onboarding Requests
 *
 * Tracks manager requests to onboard new staff (stock managers & delivery riders)
 * Admin reviews and approves/rejects requests
 */

import { Schema, model, Document, Types } from "mongoose";

export interface IStaffRequest extends Document {
  _id: Types.ObjectId;
  requestedBy: Types.ObjectId; // Manager reference
  managerName: string; // Denormalized for quick access
  name: string; // Staff member name
  email: string;
  phone?: string;
  role: "stock_manager" | "delivery";
  reason?: string; // Why this staff is needed
  status: "pending" | "approved" | "rejected";
  reviewedBy?: Types.ObjectId; // Admin who approved/rejected
  reviewNote?: string; // Admin's feedback
  createdAt: Date;
  updatedAt: Date;
}

const staffRequestSchema = new Schema<IStaffRequest>(
  {
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    managerName: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ["stock_manager", "delivery"], default: "stock_manager" },
    reason: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String },
  },
  { timestamps: true }
);

// Indexes for efficient queries
staffRequestSchema.index({ requestedBy: 1, status: 1 });
staffRequestSchema.index({ status: 1, createdAt: -1 });
staffRequestSchema.index({ email: 1 });

export const StaffRequest = model<IStaffRequest>("StaffRequest", staffRequestSchema);
