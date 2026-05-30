import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "manager" | "stock_manager" | "delivery" | "reader" | "buyer" | "developer";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isActive: boolean;
  isAffiliate: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: [2, "Name must be at least 2 characters"] },
    email: {
      type: String, required: true, unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["admin", "manager", "stock_manager", "delivery", "reader", "buyer", "developer"],
      default: "buyer",
    },
    profileImage: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String, default: "Nigeria" },
    isActive: { type: Boolean, default: true },
    isAffiliate: { type: Boolean, default: false },
    lastSignedIn: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model<IUser>("User", userSchema);
