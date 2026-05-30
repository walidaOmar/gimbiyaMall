var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/models/User.ts
var User_exports = {};
__export(User_exports, {
  User: () => User
});
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
var userSchema, User;
var init_User = __esm({
  "server/models/User.ts"() {
    userSchema = new Schema(
      {
        name: { type: String, required: true, trim: true, minlength: [2, "Name must be at least 2 characters"] },
        email: {
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true,
          match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
        },
        passwordHash: { type: String, required: true, select: false },
        phone: { type: String, trim: true },
        role: {
          type: String,
          enum: ["admin", "manager", "stock_manager", "delivery", "reader", "buyer", "developer"],
          default: "buyer"
        },
        profileImage: { type: String },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String, default: "Nigeria" },
        isActive: { type: Boolean, default: true },
        isAffiliate: { type: Boolean, default: false },
        lastSignedIn: { type: Date, default: Date.now }
      },
      { timestamps: true }
    );
    userSchema.index({ email: 1 });
    userSchema.index({ role: 1 });
    userSchema.methods.comparePassword = async function(password) {
      return bcrypt.compare(password, this.passwordHash);
    };
    User = mongoose.model("User", userSchema);
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({ transformer: superjson });
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please log in to continue." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
var protectedProcedure = t.procedure.use(requireUser);

// server/auth.ts
init_User();
import { z } from "zod";
import bcrypt2 from "bcryptjs";
import crypto from "node:crypto";

// server/_core/firebaseAuth.ts
import { createRemoteJWKSet, jwtVerify } from "jose";
var FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "gimbiya-mall";
var FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
var FIREBASE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
var firebaseJwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));
async function verifyFirebaseIdToken(token) {
  try {
    const { payload } = await jwtVerify(token, firebaseJwks, {
      issuer: FIREBASE_ISSUER,
      audience: FIREBASE_PROJECT_ID,
      algorithms: ["RS256"]
    });
    if (!payload || typeof payload !== "object") return null;
    const email = payload.email;
    const uid = payload.sub;
    if (typeof email !== "string" || typeof uid !== "string") {
      return null;
    }
    return {
      uid,
      email,
      name: typeof payload.name === "string" ? payload.name : void 0,
      emailVerified: payload.email_verified === true
    };
  } catch {
    return null;
  }
}

// server/_core/auth.ts
import { SignJWT, jwtVerify as jwtVerify2 } from "jose";
import { parse as parseCookieHeader } from "cookie";
var COOKIE_NAME = "gimbiya_session";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}
async function createSessionToken(user, options = {}) {
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1e3);
  return new SignJWT({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name
  }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt().setExpirationTime(expirationSeconds).sign(getSecretKey());
}
async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify2(token, getSecretKey(), { algorithms: ["HS256"] });
    const { userId, email, role, name } = payload;
    if (typeof userId !== "string" || typeof email !== "string" || typeof role !== "string" || typeof name !== "string") return null;
    return { userId, email, role, name };
  } catch {
    return null;
  }
}
function getSessionToken(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return void 0;
  return parseCookieHeader(cookieHeader)[COOKIE_NAME];
}
function getSessionCookieOptions(req) {
  const isProduction = process.env.NODE_ENV === "production";
  const isSecure = isProduction || req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "strict" : "lax",
    maxAge: ONE_YEAR_MS,
    path: "/"
  };
}

// server/auth.ts
var passwordSchema = z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[0-9]/, "Password must contain at least one number");
var authRouter = router({
  /**
   * auth.me
   * Returns the currently authenticated user (password hash excluded).
   * Frontend calls this on every page load to check session state.
   * Returns null when not logged in.
   *
   * FIX: Returns the FULL user document so AuthContext always has
   * name, email, role, isAffiliate, _id — not just the mutation response.
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return {
      _id: ctx.user._id.toString(),
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
      phone: ctx.user.phone ?? null,
      profileImage: ctx.user.profileImage ?? null,
      address: ctx.user.address ?? null,
      city: ctx.user.city ?? null,
      state: ctx.user.state ?? null,
      country: ctx.user.country ?? "Nigeria",
      isActive: ctx.user.isActive,
      isAffiliate: ctx.user.isAffiliate,
      createdAt: ctx.user.createdAt?.toISOString() ?? null,
      updatedAt: ctx.user.updatedAt?.toISOString() ?? null
    };
  }),
  /**
   * auth.logout
   * Clears the session cookie, logging the user out.
   * FIX: Changed from publicProcedure.query to .mutation so React Query
   * invalidation and cache clearing works properly.
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, { path: "/" });
    return { success: true };
  }),
  /**
   * auth.signupBuyer
   * Open to anyone — all sign-ups are assigned the "buyer" role.
   * Password hashed with bcrypt (12 salt rounds) before saving.
   * Auto-logs in after successful registration by setting the JWT cookie.
   *
   * Validation rules:
   *   - name        ≥ 2 chars
   *   - email       valid format, must be unique
   *   - password    ≥ 8 chars, 1 uppercase, 1 number
   *   - confirmPassword must match password
   */
  signupBuyer: publicProcedure.input(
    z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      phone: z.string().optional(),
      password: passwordSchema,
      confirmPassword: z.string()
    })
  ).mutation(async ({ input, ctx }) => {
    if (input.password !== input.confirmPassword) {
      throw new Error("Passwords do not match.");
    }
    const existing = await User.findOne({
      email: input.email.toLowerCase().trim()
    });
    if (existing) {
      throw new Error("Email already registered. Please sign in instead.");
    }
    const salt = await bcrypt2.genSalt(12);
    const passwordHash = await bcrypt2.hash(input.password, salt);
    const user = await User.create({
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      passwordHash,
      phone: input.phone?.trim() || void 0,
      role: "buyer",
      isActive: true,
      isAffiliate: false
    });
    const token = await createSessionToken(user);
    ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
    return {
      success: true,
      message: "Account created successfully! Welcome to Gimbiya Mall.",
      role: "buyer"
    };
  }),
  /**
   * auth.loginBuyer
   * For customers (buyer) and affiliates (reader) only.
   * Uses generic error message to prevent email enumeration.
   * Staff accounts are rejected here — they must use loginStaff.
   */
  loginBuyer: publicProcedure.input(
    z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required")
    })
  ).mutation(async ({ input, ctx }) => {
    const user = await User.findOne({
      email: input.email.toLowerCase().trim()
    }).select("+passwordHash");
    if (!user) throw new Error("Invalid email or password.");
    if (!user.isActive) {
      throw new Error(
        "Your account has been deactivated. Please contact support."
      );
    }
    const buyerRoles = ["buyer", "reader"];
    if (!buyerRoles.includes(user.role)) {
      throw new Error("Staff accounts must use the Staff Portal login.");
    }
    const isValid = await user.comparePassword(input.password);
    if (!isValid) throw new Error("Invalid email or password.");
    User.findByIdAndUpdate(user._id, { lastSignedIn: /* @__PURE__ */ new Date() }).exec();
    const token = await createSessionToken(user);
    ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
    return {
      success: true,
      message: "Welcome back!",
      role: user.role
    };
  }),
  /**
   * auth.firebaseLogin
   * Verifies a Firebase ID token and signs the user in on the backend.
   * If the user does not exist yet, a new buyer record is created.
   */
  firebaseLogin: publicProcedure.input(
    z.object({ idToken: z.string().min(1, "Firebase ID token is required") })
  ).mutation(async ({ input, ctx }) => {
    const firebasePayload = await verifyFirebaseIdToken(input.idToken);
    if (!firebasePayload?.email) {
      throw new Error("Invalid Firebase token.");
    }
    const email = firebasePayload.email.toLowerCase().trim();
    let user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt2.hash(randomPassword, 12);
      user = await User.create({
        name: firebasePayload.name?.trim() || email.split("@")[0],
        email,
        passwordHash,
        role: "buyer",
        isActive: true,
        isAffiliate: false
      });
    }
    if (!user.isActive) {
      throw new Error("Your account has been deactivated. Please contact support.");
    }
    const token = await createSessionToken(user);
    ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
    return {
      success: true,
      message: "Signed in with Firebase successfully.",
      role: user.role
    };
  }),
  /**
   * auth.loginStaff
   * For admin, manager, stock_manager, delivery, and developer roles.
   * Staff accounts are seeded into MongoDB at startup via mongodb.ts.
   * Buyer/reader accounts are rejected — they use loginBuyer.
   *
   * FIX: Added "stock_manager" to staffRoles array.
   */
  loginStaff: publicProcedure.input(
    z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required")
    })
  ).mutation(async ({ input, ctx }) => {
    const user = await User.findOne({
      email: input.email.toLowerCase().trim()
    }).select("+passwordHash");
    if (!user) throw new Error("Invalid email or password.");
    if (!user.isActive) {
      throw new Error(
        "Account deactivated. Please contact the administrator."
      );
    }
    const staffRoles = ["admin", "manager", "stock_manager", "delivery", "developer"];
    if (!staffRoles.includes(user.role)) {
      throw new Error("Buyer accounts must use the Shop Account login.");
    }
    const isValid = await user.comparePassword(input.password);
    if (!isValid) throw new Error("Invalid email or password.");
    User.findByIdAndUpdate(user._id, { lastSignedIn: /* @__PURE__ */ new Date() }).exec();
    const token = await createSessionToken(user);
    ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
    return {
      success: true,
      message: `Logged in as ${user.role}`,
      role: user.role
    };
  })
});

// server/routers.ts
import { z as z3 } from "zod";
import mongoose8 from "mongoose";
import { nanoid as nanoid2 } from "nanoid";
import bcrypt3 from "bcryptjs";

// server/rbac.ts
import { TRPCError as TRPCError2 } from "@trpc/server";
var adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Only admins can access this resource." });
  }
  return next({ ctx });
});
var managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "manager") {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Only managers can access this resource." });
  }
  return next({ ctx });
});
var deliveryProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "delivery") {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Only delivery personnel can access this resource." });
  }
  return next({ ctx });
});
var readerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "reader") {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Only affiliates can access this resource." });
  }
  return next({ ctx });
});
var buyerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "buyer" && ctx.user.role !== "reader") {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Only buyers can access this resource." });
  }
  return next({ ctx });
});
var developerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "developer") {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Only developers can access this resource." });
  }
  return next({ ctx });
});
var stockManagerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "stock_manager") {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Only stock managers can access this resource." });
  }
  return next({ ctx });
});
var inventoryProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "manager" && ctx.user.role !== "stock_manager" && ctx.user.role !== "admin" && ctx.user.role !== "developer") {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Only inventory staff can access this resource." });
  }
  return next({ ctx });
});
var adminOrManagerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Only admins or managers can access this resource." });
  }
  return next({ ctx });
});
var adminOrDeveloperProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "developer") {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Only admins or developers can access this resource." });
  }
  return next({ ctx });
});
var staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  const staffRoles = ["admin", "manager", "stock_manager", "delivery", "developer"];
  if (!staffRoles.includes(ctx.user.role)) {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Only staff can access this resource." });
  }
  return next({ ctx });
});

// server/db.ts
init_User();
import mongoose6 from "mongoose";

// server/models/Product.ts
import mongoose2, { Schema as Schema2 } from "mongoose";
var productSchema = new Schema2(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    categoryId: { type: Schema2.Types.ObjectId, ref: "Category", required: true },
    storeId: { type: Schema2.Types.ObjectId, ref: "Store" },
    // For virtual mall
    costPrice: { type: Number, required: true, min: 0 },
    baseSalePrice: { type: Number, required: true, min: 0 },
    commissionPercent: { type: Number, default: 10, min: 0, max: 100 },
    finalPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    soldQuantity: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    arEnabled: { type: Boolean, default: false },
    // Virtual mall feature
    limitedOffer: { type: String },
    // Virtual mall feature
    createdBy: { type: Schema2.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);
productSchema.index({ categoryId: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ name: "text", description: "text" });
var Product = mongoose2.model("Product", productSchema);

// server/models/Category.ts
import mongoose3, { Schema as Schema3 } from "mongoose";
var categorySchema = new Schema3(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);
var Category = mongoose3.model("Category", categorySchema);

// server/models/Order.ts
import mongoose4, { Schema as Schema4 } from "mongoose";
var orderItemSchema = new Schema4(
  {
    productId: { type: Schema4.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    costPrice: { type: Number, required: true },
    baseSalePrice: { type: Number, required: true },
    commissionPercent: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  },
  { _id: false }
);
var orderSchema = new Schema4(
  {
    orderId: { type: String, required: true, unique: true },
    buyerId: { type: Schema4.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    commissionAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "assigned", "in_transit", "delivered", "cancelled"],
      default: "pending"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    paymentReference: { type: String },
    shippingAddress: { type: String, required: true },
    shippingCity: { type: String, required: true },
    shippingState: { type: String },
    shippingZipCode: { type: String },
    shippingCountry: { type: String, required: true, default: "Nigeria" },
    buyerPhone: { type: String, required: true },
    deliveryRiderId: { type: Schema4.Types.ObjectId, ref: "User" },
    deliveryNotes: { type: String },
    referralCode: { type: String }
  },
  { timestamps: true }
);
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryRiderId: 1 });
orderSchema.index({ orderId: 1 });
var Order = mongoose4.model("Order", orderSchema);

// server/models/CartItem.ts
import mongoose5, { Schema as Schema5 } from "mongoose";
var cartItemSchema = new Schema5(
  {
    userId: { type: Schema5.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema5.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
  },
  { timestamps: true }
);
cartItemSchema.index({ userId: 1 });
cartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });
var CartItem = mongoose5.model("CartItem", cartItemSchema);

// server/db.ts
async function getAllUsers(role, limit = 50, offset = 0) {
  const filter = {};
  if (role) filter.role = role;
  return User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
}
async function updateUserRole(userId, role) {
  await User.findByIdAndUpdate(userId, { role });
}
async function setUserAffiliate(userId, isAffiliate) {
  await User.findByIdAndUpdate(userId, {
    isAffiliate,
    role: isAffiliate ? "reader" : "buyer"
  });
}
async function getProductById(id) {
  return Product.findById(id).populate("categoryId").lean();
}
async function getFeaturedProducts(limit = 10) {
  return Product.find({ isFeatured: true, isActive: true }).populate("categoryId").limit(limit).lean();
}
async function getProductsByCategory(categoryId, limit = 20, offset = 0) {
  return Product.find({ categoryId, isActive: true }).skip(offset).limit(limit).lean();
}
async function searchProducts(query, limit = 20, offset = 0) {
  return Product.find({ $text: { $search: query }, isActive: true }).skip(offset).limit(limit).lean();
}
async function getAllCategories() {
  return Category.find({ isActive: true }).lean();
}
async function getCartItems(userId) {
  return CartItem.find({ userId }).populate("productId").lean();
}
async function addToCart(userId, productId, quantity) {
  await CartItem.findOneAndUpdate(
    { userId, productId },
    { $inc: { quantity } },
    { upsert: true, new: true }
  );
}
async function removeFromCart(cartItemId) {
  await CartItem.findByIdAndDelete(cartItemId);
}
async function clearCart(userId) {
  await CartItem.deleteMany({ userId });
}
async function getUserOrders(userId, limit = 20, offset = 0) {
  return Order.find({ buyerId: userId }).sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
}
async function getOrderByOrderId(orderId) {
  return Order.findOne({ orderId }).lean();
}
async function getDeliveryOrders(riderId, limit = 20, offset = 0) {
  return Order.find({ deliveryRiderId: riderId }).sort({ createdAt: -1 }).skip(offset).limit(limit).populate("buyerId", "name phone").lean();
}
async function getPlatformStats() {
  const [totalUsers, totalBuyers, totalProducts, totalOrders, deliveredOrders, activeUsers, suspendedAccounts] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "buyer" }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.countDocuments({ status: "delivered" }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false })
  ]);
  const revenueAgg = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$finalAmount" } } }
  ]);
  const totalRevenue = revenueAgg[0]?.total ?? 0;
  return {
    totalUsers,
    totalBuyers,
    totalProducts,
    totalOrders,
    deliveredOrders,
    totalRevenue,
    activeUsers,
    suspendedAccounts,
    pendingApprovals: 0
  };
}
async function getTotalSalesStats() {
  const now = /* @__PURE__ */ new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const salesAgg = await Order.aggregate([
    { $match: { paymentStatus: "paid", createdAt: { $gte: firstMonth } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        revenue: { $sum: "$finalAmount" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);
  const statusAgg = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);
  const totalRevenue = salesAgg.reduce((sum, item) => sum + (item.revenue ?? 0), 0);
  const revenueTrend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const label = date.toLocaleString("en-US", { month: "short" });
    const match = salesAgg.find((item) => item._id.year === year && item._id.month === month);
    return {
      month: label,
      revenue: match?.revenue ?? 0,
      orders: match?.orders ?? 0
    };
  });
  const statusMap = statusAgg.reduce((acc, item) => {
    acc[item._id] = item.count ?? 0;
    return acc;
  }, {});
  return {
    revenueTrend,
    totalRevenue,
    totalOrders: statusAgg.reduce((sum, item) => sum + item.count, 0),
    pendingOrders: statusMap.pending ?? 0,
    processingOrders: statusMap.processing ?? 0,
    assignedOrders: statusMap.assigned ?? 0,
    inTransitOrders: statusMap.in_transit ?? 0,
    deliveredOrders: statusMap.delivered ?? 0,
    cancelledOrders: statusMap.cancelled ?? 0
  };
}
async function getInventorySummary(threshold = 10) {
  const [totalProducts, activeProducts, inactiveProducts, lowStockItems, totalStockValueAgg] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: false }),
    Product.countDocuments({ isActive: true, stockQuantity: { $lte: threshold } }),
    Product.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$stockQuantity", "$baseSalePrice"] } }
        }
      }
    ])
  ]);
  return {
    totalProducts,
    activeProducts,
    inactiveProducts,
    lowStockItems,
    totalStockValue: totalStockValueAgg[0]?.totalValue ?? 0
  };
}
async function getWeeklySalesStats(days = 7) {
  const now = /* @__PURE__ */ new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const salesAgg = await Order.aggregate([
    { $match: { paymentStatus: "paid", createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        revenue: { $sum: "$finalAmount" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);
  const trend = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const label = date.toLocaleDateString("en-US", { weekday: "short" });
    const match = salesAgg.find(
      (item) => item._id.year === date.getFullYear() && item._id.month === date.getMonth() + 1 && item._id.day === date.getDate()
    );
    return {
      day: label,
      revenue: match?.revenue ?? 0,
      orders: match?.orders ?? 0
    };
  });
  return {
    totalRevenue: trend.reduce((sum, item) => sum + item.revenue, 0),
    totalOrders: trend.reduce((sum, item) => sum + item.orders, 0),
    trend
  };
}

// server/routers.ts
init_User();

// server/models/Store.ts
import mongoose7, { Schema as Schema6 } from "mongoose";
var storeSchema = new Schema6(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    category: { type: String, enum: ["store", "office"], default: "store" },
    description: { type: String },
    live: { type: Boolean, default: true },
    maintenance: { type: Boolean, default: false },
    contact: {
      email: { type: String },
      phone: { type: String },
      whatsapp: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String }
    },
    hours: { type: Schema6.Types.Mixed },
    paymentMethods: { type: Schema6.Types.Mixed },
    notifications: { type: Schema6.Types.Mixed },
    brandColors: {
      primary: { type: String },
      secondary: { type: String },
      accent: { type: String }
    },
    logoImageUrl: { type: String },
    bannerImageUrl: { type: String },
    buildingLevel: { type: Number, default: 1 },
    location: {
      x: { type: Number },
      y: { type: Number }
    },
    marketingPitch: {
      headline: { type: String },
      promoText: { type: String },
      ctaLink: { type: String },
      videoUrl: { type: String }
    },
    flyers: [{
      title: { type: String, required: true },
      description: { type: String },
      imageUrl: { type: String },
      validUntil: { type: Date }
    }],
    products: [{ type: Schema6.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);
storeSchema.index({ category: 1, isActive: 1 });
storeSchema.index({ buildingLevel: 1 });
var Store = mongoose7.model("Store", storeSchema);

// server/models/StaffRequest.ts
import { Schema as Schema7, model } from "mongoose";
var staffRequestSchema = new Schema7(
  {
    requestedBy: { type: Schema7.Types.ObjectId, ref: "User", required: true },
    managerName: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ["stock_manager", "delivery"], default: "stock_manager" },
    reason: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: Schema7.Types.ObjectId, ref: "User" },
    reviewNote: { type: String }
  },
  { timestamps: true }
);
staffRequestSchema.index({ requestedBy: 1, status: 1 });
staffRequestSchema.index({ status: 1, createdAt: -1 });
staffRequestSchema.index({ email: 1 });
var StaffRequest = model("StaffRequest", staffRequestSchema);

// server/payment-router.ts
import { z as z2 } from "zod";

// server/monnify.ts
import axios from "axios";
var monnifyClient = axios.create({
  baseURL: process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com",
  auth: {
    username: process.env.MONNIFY_API_KEY || "",
    password: process.env.MONNIFY_SECRET_KEY || ""
  }
});
async function initiateMonnifyPayment(request) {
  try {
    const response = await monnifyClient.post(
      "/api/v1/merchant/transactions/init-transaction",
      {
        amount: request.amount,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        paymentReference: request.paymentReference,
        paymentDescription: request.paymentDescription,
        currencyCode: request.currencyCode,
        contractCode: request.contractCode,
        redirectUrl: request.redirectUrl,
        incomeSplitConfig: null,
        metadata: request.metadata
      }
    );
    return response.data;
  } catch (error) {
    console.error("[Monnify] Payment initiation failed:", error.response?.data || error.message);
    throw new Error(`Failed to initiate payment: ${error.response?.data?.responseMessage || error.message}`);
  }
}
async function verifyMonnifyPayment(transactionReference) {
  try {
    const response = await monnifyClient.get(
      `/api/v1/merchant/transactions/query?transactionReference=${transactionReference}`
    );
    return response.data;
  } catch (error) {
    console.error("[Monnify] Payment verification failed:", error.response?.data || error.message);
    throw new Error(`Failed to verify payment: ${error.response?.data?.responseMessage || error.message}`);
  }
}
async function getMonnifyTransactionDetails(transactionReference) {
  try {
    const response = await verifyMonnifyPayment(transactionReference);
    return response.responseBody;
  } catch (error) {
    console.error("[Monnify] Failed to get transaction details:", error);
    throw error;
  }
}

// server/payment-router.ts
import { nanoid } from "nanoid";
var paymentRouter = router({
  /**
   * Initiate a payment for an order
   */
  initiatePayment: buyerProcedure.input(z2.object({
    orderId: z2.string(),
    redirectUrl: z2.string()
  })).mutation(async ({ input, ctx }) => {
    const order = await getOrderByOrderId(input.orderId);
    if (!order) throw new Error("Order not found");
    const buyerId = order.buyerId?._id || order.buyerId;
    if (buyerId.toString() !== ctx.user._id.toString()) {
      throw new Error("Unauthorized: Order does not belong to this user");
    }
    const transactionRef = `TXN-${nanoid(12)}`;
    try {
      const paymentResponse = await initiateMonnifyPayment({
        amount: parseFloat(order.finalAmount.toString()),
        customerName: ctx.user.name || "Customer",
        customerEmail: ctx.user.email || "",
        paymentReference: order.orderId,
        paymentDescription: `Payment for Order ${order.orderId}`,
        currencyCode: "NGN",
        contractCode: process.env.MONNIFY_CONTRACT_CODE || "",
        redirectUrl: input.redirectUrl,
        metadata: {
          orderId: order._id.toString(),
          userId: ctx.user._id.toString(),
          transactionReference: transactionRef
        }
      });
      if (!paymentResponse.requestSuccessful) {
        throw new Error(paymentResponse.responseMessage);
      }
      await Order.findOneAndUpdate(
        { orderId: order.orderId },
        {
          paymentStatus: "pending",
          paymentReference: transactionRef
        }
      );
      return {
        success: true,
        transactionReference: transactionRef,
        paymentLink: paymentResponse.responseBody?.checkoutUrl,
        accessToken: paymentResponse.responseBody?.accessToken
      };
    } catch (error) {
      console.error("[Payment] Initiation failed:", error);
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }),
  /**
   * Verify payment status
   */
  verifyPayment: buyerProcedure.input(z2.object({
    transactionReference: z2.string()
  })).mutation(async ({ input }) => {
    try {
      const paymentDetails = await getMonnifyTransactionDetails(input.transactionReference);
      if (!paymentDetails) {
        throw new Error("Payment details not found");
      }
      if (paymentDetails.paymentStatus === "PAID") {
        await Order.findOneAndUpdate(
          { paymentReference: input.transactionReference },
          {
            paymentStatus: "paid",
            status: "paid"
          }
        );
      }
      return {
        success: true,
        status: paymentDetails.paymentStatus,
        amount: paymentDetails.amountPaid,
        transactionReference: paymentDetails.transactionReference,
        paidOn: paymentDetails.paidOn
      };
    } catch (error) {
      console.error("[Payment] Verification failed:", error);
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }),
  /**
   * Get payment history for a buyer
   */
  getPaymentHistory: buyerProcedure.input(z2.object({
    limit: z2.number().default(20),
    offset: z2.number().default(0)
  })).query(async ({ input, ctx }) => {
    const result = await Order.find({ buyerId: ctx.user._id }).sort({ createdAt: -1 }).limit(input.limit).skip(input.offset).lean();
    return result.map((order) => ({
      orderId: order.orderId,
      amount: order.finalAmount,
      status: order.paymentStatus,
      createdAt: order.createdAt,
      items: order._id.toString()
    }));
  }),
  /**
   * Get order payment details
   */
  getOrderPayment: publicProcedure.input(z2.object({
    orderId: z2.string()
  })).query(async ({ input }) => {
    const order = await getOrderByOrderId(input.orderId);
    if (!order) return null;
    return {
      orderId: order.orderId,
      amount: order.finalAmount,
      status: order.paymentStatus,
      createdAt: order.createdAt
    };
  })
});

// server/pricing.ts
var TRANSACTION_FEE_RATE = 0.015;
function calcTransactionFee(orderAmount) {
  return parseFloat((orderAmount * TRANSACTION_FEE_RATE).toFixed(2));
}
function calcFinalPrice(baseSalePrice, commissionPercent) {
  return parseFloat((baseSalePrice * (1 + commissionPercent / 100)).toFixed(2));
}
function calcCommissionAmount(finalPrice, baseSalePrice, quantity) {
  return parseFloat(((finalPrice - baseSalePrice) * quantity).toFixed(2));
}
function calcOrderTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.finalPrice * i.quantity, 0);
  const commissionTotal = items.reduce(
    (sum, i) => sum + calcCommissionAmount(i.finalPrice, i.baseSalePrice, i.quantity),
    0
  );
  const transactionFee = calcTransactionFee(subtotal);
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    transactionFee,
    totalAmount: parseFloat(subtotal.toFixed(2)),
    // buyer pays subtotal; fee is platform's cut of commission
    commissionTotal: parseFloat(commissionTotal.toFixed(2))
  };
}

// server/routers.ts
var paginationInput = z3.object({
  limit: z3.number().min(1).max(100).default(20),
  offset: z3.number().min(0).default(0)
});
var appRouter = router({
  auth: authRouter,
  payment: paymentRouter,
  // ── PRODUCTS ─────────────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure.input(paginationInput).query(
      async ({ input }) => Product.find({ isActive: true }).populate("categoryId").skip(input.offset).limit(input.limit).lean()
    ),
    listAll: managerProcedure.input(paginationInput).query(
      async ({ input }) => Product.find().populate("categoryId").skip(input.offset).limit(input.limit).lean()
    ),
    featured: publicProcedure.query(() => getFeaturedProducts(10)),
    byCategory: publicProcedure.input(z3.object({ categoryId: z3.string(), limit: z3.number().default(20), offset: z3.number().default(0) })).query(({ input }) => getProductsByCategory(input.categoryId, input.limit, input.offset)),
    search: publicProcedure.input(z3.object({ query: z3.string(), limit: z3.number().default(20), offset: z3.number().default(0) })).query(({ input }) => searchProducts(input.query, input.limit, input.offset)),
    detail: publicProcedure.input(z3.object({ id: z3.string() })).query(({ input }) => getProductById(input.id)),
    create: managerProcedure.input(z3.object({
      name: z3.string().min(1),
      description: z3.string().optional(),
      categoryId: z3.string(),
      storeId: z3.string().optional(),
      // For virtual mall
      costPrice: z3.number().min(0),
      baseSalePrice: z3.number().min(0),
      commissionPercent: z3.number().min(0).max(100).default(10),
      stockQuantity: z3.number().min(0).default(0),
      images: z3.array(z3.string()).default([]),
      arEnabled: z3.boolean().default(false),
      // Virtual mall
      limitedOffer: z3.string().optional()
      // Virtual mall
    })).mutation(async ({ input, ctx }) => {
      const finalPrice = calcFinalPrice(input.baseSalePrice, input.commissionPercent);
      const p = await Product.create({
        ...input,
        categoryId: new mongoose8.Types.ObjectId(input.categoryId),
        storeId: input.storeId ? new mongoose8.Types.ObjectId(input.storeId) : void 0,
        finalPrice,
        createdBy: ctx.user._id
      });
      if (input.storeId) {
        await Store.findByIdAndUpdate(input.storeId, { $push: { products: p._id } });
      }
      return { success: true, id: p._id.toString() };
    }),
    update: managerProcedure.input(z3.object({
      id: z3.string(),
      name: z3.string().optional(),
      description: z3.string().optional(),
      baseSalePrice: z3.number().optional(),
      commissionPercent: z3.number().optional(),
      stockQuantity: z3.number().optional(),
      isFeatured: z3.boolean().optional(),
      isActive: z3.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const product = await Product.findById(id);
      if (!product) throw new Error("Product not found");
      if (updates.baseSalePrice !== void 0 || updates.commissionPercent !== void 0) {
        const price = updates.baseSalePrice ?? product.baseSalePrice;
        const pct = updates.commissionPercent ?? product.commissionPercent;
        updates.finalPrice = calcFinalPrice(price, pct);
      }
      await Product.findByIdAndUpdate(id, updates);
      return { success: true };
    }),
    delete: managerProcedure.input(z3.object({ id: z3.string() })).mutation(async ({ input }) => {
      await Product.findByIdAndUpdate(input.id, { isActive: false });
      return { success: true };
    })
  }),
  // ── STORES ──────────────────────────────────────────────────────────────────
  stores: router({
    list: publicProcedure.input(paginationInput).query(
      async ({ input }) => Store.find({ isActive: true }).populate("products").skip(input.offset).limit(input.limit).lean()
    ),
    detail: publicProcedure.input(z3.object({ id: z3.string() })).query(async ({ input }) => {
      const store2 = await Store.findById(input.id).populate("products").lean();
      if (!store2) throw new Error("Store not found");
      return store2;
    }),
    create: adminOrManagerProcedure.input(z3.object({
      name: z3.string().min(1),
      category: z3.enum(["store", "office"]).default("store"),
      description: z3.string().optional(),
      bannerImageUrl: z3.string().optional(),
      buildingLevel: z3.number().default(1),
      location: z3.object({ x: z3.number(), y: z3.number() }).optional(),
      marketingPitch: z3.object({
        headline: z3.string().optional(),
        promoText: z3.string().optional(),
        ctaLink: z3.string().optional(),
        videoUrl: z3.string().optional()
      }).optional(),
      flyers: z3.array(z3.object({
        title: z3.string(),
        description: z3.string().optional(),
        imageUrl: z3.string().optional(),
        validUntil: z3.date().optional()
      })).default([])
    })).mutation(async ({ input }) => {
      const store2 = await Store.create(input);
      return { success: true, id: store2._id.toString() };
    }),
    update: adminOrManagerProcedure.input(z3.object({
      id: z3.string(),
      name: z3.string().optional(),
      slug: z3.string().optional(),
      category: z3.enum(["store", "office"]).optional(),
      description: z3.string().optional(),
      live: z3.boolean().optional(),
      maintenance: z3.boolean().optional(),
      contact: z3.object({
        email: z3.string().email().optional(),
        phone: z3.string().optional(),
        whatsapp: z3.string().optional(),
        address: z3.string().optional(),
        city: z3.string().optional(),
        state: z3.string().optional()
      }).optional(),
      hours: z3.record(z3.string(), z3.object({ open: z3.boolean(), from: z3.string(), to: z3.string() })).optional(),
      paymentMethods: z3.record(z3.string(), z3.boolean()).optional(),
      notifications: z3.record(z3.string(), z3.boolean()).optional(),
      brandColors: z3.object({
        primary: z3.string().optional(),
        secondary: z3.string().optional(),
        accent: z3.string().optional()
      }).optional(),
      logoImageUrl: z3.string().optional(),
      bannerImageUrl: z3.string().optional(),
      buildingLevel: z3.number().optional(),
      location: z3.object({ x: z3.number(), y: z3.number() }).optional(),
      marketingPitch: z3.object({
        headline: z3.string().optional(),
        promoText: z3.string().optional(),
        ctaLink: z3.string().optional(),
        videoUrl: z3.string().optional()
      }).optional(),
      isActive: z3.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await Store.findByIdAndUpdate(id, updates);
      return { success: true };
    }),
    addFlyer: adminOrManagerProcedure.input(z3.object({
      storeId: z3.string(),
      flyer: z3.object({
        title: z3.string(),
        description: z3.string().optional(),
        imageUrl: z3.string().optional(),
        validUntil: z3.date().optional()
      })
    })).mutation(async ({ input }) => {
      await Store.findByIdAndUpdate(input.storeId, { $push: { flyers: input.flyer } });
      return { success: true };
    })
  }),
  // ── CATEGORIES ───────────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(() => getAllCategories()),
    create: adminOrManagerProcedure.input(z3.object({ name: z3.string(), description: z3.string().optional(), image: z3.string().optional() })).mutation(async ({ input }) => {
      const cat = await Category.create(input);
      return { success: true, id: cat._id.toString() };
    }),
    update: adminOrManagerProcedure.input(z3.object({ id: z3.string(), name: z3.string().optional(), description: z3.string().optional(), isActive: z3.boolean().optional() })).mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await Category.findByIdAndUpdate(id, updates);
      return { success: true };
    })
  }),
  // ── CART ─────────────────────────────────────────────────────────────────────
  cart: router({
    list: buyerProcedure.query(async ({ ctx }) => getCartItems(ctx.user._id.toString())),
    add: buyerProcedure.input(z3.object({ productId: z3.string(), quantity: z3.number().min(1) })).mutation(async ({ input, ctx }) => {
      await addToCart(ctx.user._id.toString(), input.productId, input.quantity);
      return { success: true };
    }),
    remove: buyerProcedure.input(z3.object({ cartItemId: z3.string() })).mutation(async ({ input }) => {
      await removeFromCart(input.cartItemId);
      return { success: true };
    }),
    updateQuantity: buyerProcedure.input(z3.object({ cartItemId: z3.string(), quantity: z3.number().min(1) })).mutation(async ({ input }) => {
      await CartItem.findByIdAndUpdate(input.cartItemId, { quantity: input.quantity });
      return { success: true };
    }),
    clear: buyerProcedure.mutation(async ({ ctx }) => {
      await clearCart(ctx.user._id.toString());
      return { success: true };
    })
  }),
  // ── ORDERS ───────────────────────────────────────────────────────────────────
  orders: router({
    list: buyerProcedure.input(paginationInput).query(async ({ input, ctx }) => getUserOrders(ctx.user._id.toString(), input.limit, input.offset)),
    detail: publicProcedure.input(z3.object({ orderId: z3.string() })).query(async ({ input }) => {
      const order = await getOrderByOrderId(input.orderId);
      if (!order) throw new Error("Order not found");
      return order;
    }),
    create: buyerProcedure.input(z3.object({
      shippingAddress: z3.string(),
      shippingCity: z3.string(),
      shippingState: z3.string().optional(),
      shippingZipCode: z3.string().optional(),
      shippingCountry: z3.string().default("Nigeria"),
      buyerPhone: z3.string(),
      referralCode: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const userId = ctx.user._id.toString();
      const items_raw = await getCartItems(userId);
      if (items_raw.length === 0) throw new Error("Your cart is empty.");
      const lineItems = items_raw.map((item) => {
        const p = item.productId;
        return { finalPrice: p.finalPrice, baseSalePrice: p.baseSalePrice, quantity: item.quantity };
      });
      const totals = calcOrderTotals(lineItems);
      const items = items_raw.map((item) => {
        const p = item.productId;
        return {
          productId: p._id,
          name: p.name,
          quantity: item.quantity,
          costPrice: p.costPrice,
          baseSalePrice: p.baseSalePrice,
          commissionPercent: p.commissionPercent,
          commissionAmount: parseFloat(((p.finalPrice - p.baseSalePrice) * item.quantity).toFixed(2)),
          finalPrice: p.finalPrice,
          subtotal: parseFloat((p.finalPrice * item.quantity).toFixed(2))
        };
      });
      const orderId = `ORD-${nanoid2(10).toUpperCase()}`;
      await Order.create({
        orderId,
        buyerId: userId,
        items,
        totalAmount: totals.subtotal,
        commissionAmount: totals.commissionTotal,
        finalAmount: totals.totalAmount,
        ...input
      });
      await clearCart(userId);
      return { success: true, orderId, totalAmount: totals.totalAmount };
    }),
    // Order cancellation: buyer only, pending/paid only, restores stock
    cancel: buyerProcedure.input(z3.object({ orderId: z3.string() })).mutation(async ({ input, ctx }) => {
      const order = await getOrderByOrderId(input.orderId);
      if (!order) throw new Error("Order not found");
      const buyerId = order.buyerId?._id || order.buyerId;
      if (!buyerId || buyerId.toString() !== ctx.user._id.toString())
        throw new Error("Not authorised to cancel this order");
      if (!["pending", "paid"].includes(order.status))
        throw new Error("Order cannot be cancelled at this stage");
      for (const item of order.items ?? []) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity } });
      }
      await Order.findOneAndUpdate({ orderId: input.orderId }, { status: "cancelled" });
      return { success: true };
    }),
    updateStatus: staffProcedure.input(z3.object({ orderId: z3.string(), status: z3.enum(["pending", "paid", "processing", "assigned", "in_transit", "delivered", "cancelled"]) })).mutation(async ({ input }) => {
      await Order.findOneAndUpdate({ orderId: input.orderId }, { status: input.status });
      return { success: true };
    })
  }),
  // ── DELIVERY ─────────────────────────────────────────────────────────────────
  delivery: router({
    myOrders: deliveryProcedure.input(paginationInput).query(async ({ input, ctx }) => getDeliveryOrders(ctx.user._id.toString(), input.limit, input.offset)),
    updateStatus: deliveryProcedure.input(z3.object({ orderId: z3.string(), status: z3.enum(["assigned", "in_transit", "delivered"]) })).mutation(async ({ input }) => {
      const update = { status: input.status };
      if (input.status === "delivered") update.paymentStatus = "paid";
      await Order.findOneAndUpdate({ orderId: input.orderId }, update);
      return { success: true };
    }),
    assignOrder: adminOrManagerProcedure.input(z3.object({ orderId: z3.string(), riderId: z3.string() })).mutation(async ({ input }) => {
      await Order.findOneAndUpdate({ orderId: input.orderId }, { deliveryRiderId: input.riderId, status: "assigned" });
      return { success: true };
    })
  }),
  // ── ADMIN ────────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(() => getPlatformStats()),
    salesStats: adminProcedure.query(() => getTotalSalesStats()),
    users: adminOrDeveloperProcedure.input(z3.object({ role: z3.string().optional(), limit: z3.number().default(50), offset: z3.number().default(0) })).query(({ input }) => getAllUsers(input.role, input.limit, input.offset)),
    updateUserRole: adminOrDeveloperProcedure.input(z3.object({ userId: z3.string(), role: z3.string() })).mutation(async ({ input }) => {
      await updateUserRole(input.userId, input.role);
      return { success: true };
    }),
    enableAffiliate: adminOrDeveloperProcedure.input(z3.object({ userId: z3.string(), enable: z3.boolean() })).mutation(async ({ input }) => {
      await setUserAffiliate(input.userId, input.enable);
      return { success: true };
    }),
    allOrders: adminProcedure.input(z3.object({ status: z3.string().optional(), limit: z3.number().default(50), offset: z3.number().default(0) })).query(async ({ input }) => {
      const filter = {};
      if (input.status) filter.status = input.status;
      return Order.find(filter).sort({ createdAt: -1 }).skip(input.offset).limit(input.limit).populate("buyerId", "name email phone").lean();
    }),
    onboardStockManager: adminProcedure.input(z3.object({
      name: z3.string().min(2),
      email: z3.string().email(),
      password: z3.string().min(8),
      phone: z3.string().optional()
    })).mutation(async ({ input }) => {
      const existing = await User.findOne({ email: input.email.toLowerCase() });
      if (existing) throw new Error("A user with this email already exists");
      const salt = await bcrypt3.genSalt(12);
      const passwordHash = await bcrypt3.hash(input.password, salt);
      const user = await User.create({ name: input.name, email: input.email.toLowerCase(), passwordHash, phone: input.phone, role: "stock_manager", isActive: true });
      return { success: true, userId: user._id.toString() };
    }),
    listStaff: adminProcedure.input(z3.object({ role: z3.string().optional() })).query(async ({ input }) => {
      const filter = { role: { $in: ["manager", "stock_manager", "delivery"] } };
      if (input.role) filter.role = input.role;
      return User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).lean();
    }),
    globalSearch: adminProcedure.input(z3.object({ query: z3.string().min(1), roles: z3.array(z3.string()).optional(), limit: z3.number().default(50) })).query(async ({ input }) => {
      const match = new RegExp(input.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const roleFilter = input.roles?.length ? { role: { $in: input.roles } } : {};
      return User.find({
        ...roleFilter,
        $or: [
          { name: match },
          { email: match },
          { _id: input.query.match(/^[0-9a-fA-F]{24}$/) ? input.query : void 0 }
        ].filter(Boolean)
      }).select("-passwordHash").sort({ createdAt: -1 }).limit(input.limit).lean();
    }),
    lookupUserById: adminProcedure.input(z3.object({ userId: z3.string().min(1) })).query(async ({ input }) => {
      const user = await User.findById(input.userId).select("-passwordHash").lean();
      if (!user) throw new Error("User not found");
      return user;
    }),
    removeStoreStaff: adminProcedure.input(z3.object({ userId: z3.string() })).mutation(async ({ input }) => {
      await User.findByIdAndUpdate(input.userId, { role: "buyer", isAffiliate: false });
      return { success: true };
    }),
    onboardExistingUser: adminProcedure.input(z3.object({ userId: z3.string(), role: z3.string() })).mutation(async ({ input }) => {
      const user = await User.findById(input.userId);
      if (!user) throw new Error("User not found");
      if (["admin", "developer"].includes(user.role)) throw new Error("Cannot modify this user role");
      const updates = { role: input.role, isActive: true };
      if (input.role === "reader") updates.isAffiliate = true;
      await User.findByIdAndUpdate(input.userId, updates);
      return { success: true, userName: user.name, newRole: input.role };
    }),
    createStoreStaff: adminProcedure.input(z3.object({ name: z3.string().min(2), email: z3.string().email(), password: z3.string().min(8), phone: z3.string().optional(), role: z3.enum(["stock_manager", "delivery"]) })).mutation(async ({ input }) => {
      const existing = await User.findOne({ email: input.email.toLowerCase() });
      if (existing) throw new Error("A user with this email already exists");
      const salt = await bcrypt3.genSalt(12);
      const passwordHash = await bcrypt3.hash(input.password, salt);
      const user = await User.create({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        phone: input.phone,
        role: input.role,
        isActive: true
      });
      return { success: true, userId: user._id.toString(), name: user.name };
    }),
    toggleUserActive: adminProcedure.input(z3.object({ userId: z3.string(), isActive: z3.boolean() })).mutation(async ({ input }) => {
      await User.findByIdAndUpdate(input.userId, { isActive: input.isActive });
      return { success: true };
    })
  }),
  // ── MANAGER ──────────────────────────────────────────────────────────────────
  manager: router({
    // Staff Onboarding Requests
    submitStaffRequest: managerProcedure.input(z3.object({
      name: z3.string().min(1),
      email: z3.string().email(),
      phone: z3.string().optional(),
      role: z3.enum(["stock_manager", "delivery"]),
      reason: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const manager = ctx.user;
      const existing = await StaffRequest.findOne({
        requestedBy: manager._id,
        email: input.email.toLowerCase(),
        status: { $in: ["pending", "approved"] }
      });
      if (existing) throw new Error("A request for this email already exists");
      const req = await StaffRequest.create({
        requestedBy: manager._id,
        managerName: manager.name,
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        role: input.role,
        reason: input.reason,
        status: "pending"
      });
      return { success: true, id: req._id.toString() };
    }),
    myStaffRequests: managerProcedure.query(async ({ ctx }) => {
      const manager = ctx.user;
      const reqs = await StaffRequest.find({ requestedBy: manager._id }).sort({ createdAt: -1 }).lean();
      return reqs || [];
    }),
    // Order Assignment
    ordersForAssignment: managerProcedure.input(z3.object({
      status: z3.string().optional(),
      search: z3.string().optional(),
      limit: z3.number().default(20),
      offset: z3.number().default(0)
    })).query(async ({ input }) => {
      const filter = {};
      if (input.status) filter.status = input.status;
      if (input.search) {
        filter.orderId = new RegExp(input.search, "i");
      }
      const total = await Order.countDocuments(filter);
      const orders = await Order.find(filter).sort({ createdAt: -1 }).skip(input.offset).limit(input.limit).populate("buyerId", "name email phone").populate("deliveryRiderId", "name email phone").lean();
      return { orders, total };
    }),
    listRiders: managerProcedure.query(async () => {
      const riders = await User.find({ role: "delivery", isActive: true }).select("name email phone").lean();
      return riders;
    }),
    assignRider: managerProcedure.input(z3.object({ orderId: z3.string(), riderId: z3.string() })).mutation(async ({ input }) => {
      const rider = await User.findById(input.riderId).select("name email phone").lean();
      if (!rider) throw new Error("Rider not found");
      await Order.findOneAndUpdate(
        { orderId: input.orderId },
        { deliveryRiderId: input.riderId, status: "assigned" }
      );
      return { success: true, riderName: rider.name };
    }),
    unassignRider: managerProcedure.input(z3.object({ orderId: z3.string() })).mutation(async ({ input }) => {
      await Order.findOneAndUpdate(
        { orderId: input.orderId },
        { deliveryRiderId: null, status: "paid" }
      );
      return { success: true };
    }),
    // Analytics
    branchAnalytics: managerProcedure.input(z3.object({ days: z3.number().default(30) })).query(async ({ input, ctx }) => {
      const manager = ctx.user;
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1e3);
      const orders = await Order.find({ createdAt: { $gte: since } }).populate("buyerId").populate("deliveryRiderId").lean();
      const revenue = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
      const commission = orders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
      const delivered = orders.filter((o) => o.status === "delivered").length;
      const cancelled = orders.filter((o) => o.status === "cancelled").length;
      const trend = {};
      orders.forEach((o) => {
        const day = new Date(o.createdAt).toLocaleDateString("en-GB");
        if (!trend[day]) trend[day] = { day, revenue: 0, commission: 0 };
        trend[day].revenue += o.finalAmount || 0;
        trend[day].commission += o.commissionAmount || 0;
      });
      const monthlyTrend = Object.values(trend).slice(-10);
      const productSales = {};
      orders.forEach((o) => {
        productSales["Product"] = (productSales["Product"] || 0) + 1;
      });
      const topProducts = Object.entries(productSales).map(([name, sales]) => ({ name, sales })).sort((a, b) => b.sales - a.sales).slice(0, 10);
      const staff = await User.find({ role: { $in: ["delivery", "stock_manager"] }, isActive: true }).select("name role email").lean();
      const recentOrders = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20).map((o) => ({
        orderId: o.orderId,
        amount: o.finalAmount,
        status: o.status
      }));
      return {
        revenue,
        commission,
        orders: orders.length,
        delivered,
        cancelled,
        monthlyTrend,
        topProducts,
        staff,
        recentOrders
      };
    })
  }),
  // ── AFFILIATE ────────────────────────────────────────────────────────────────
  affiliate: router({
    getReferralLink: readerProcedure.query(async ({ ctx }) => {
      const userId = ctx.user._id.toString();
      const code = `REF-${userId.slice(-8).toUpperCase()}`;
      const baseUrl = process.env.VITE_APP_URL ?? "http://localhost:3000";
      return { code, url: `${baseUrl}/products?ref=${code}` };
    }),
    myStats: readerProcedure.query(async ({ ctx }) => {
      const userId = ctx.user._id.toString();
      const code = `REF-${userId.slice(-8).toUpperCase()}`;
      const totalReferrals = await Order.countDocuments({ referralCode: code });
      return { totalReferrals, totalEarnings: 0 };
    })
  }),
  // ── INVENTORY (shared: manager + stock_manager + admin + developer) ───────────
  inventory: router({
    list: inventoryProcedure.input(paginationInput).query(
      async ({ input }) => Product.find({ isActive: true }).select("name stockQuantity soldQuantity isFeatured categoryId images").populate("categoryId", "name").skip(input.offset).limit(input.limit).lean()
    ),
    adjustStock: inventoryProcedure.input(z3.object({
      productId: z3.string().refine((val) => mongoose8.Types.ObjectId.isValid(val), {
        message: "Invalid Product ID format"
      }),
      quantityChange: z3.number(),
      reason: z3.enum(["restock", "sale_adjustment", "damage", "return", "correction", "other"]),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const product = await Product.findById(input.productId);
      if (!product) throw new Error("Product not found");
      const newStock = product.stockQuantity + input.quantityChange;
      if (newStock < 0) throw new Error("Stock cannot go below zero");
      await Product.findByIdAndUpdate(input.productId, { stockQuantity: newStock });
      console.log(`[Inventory] ${ctx.user.name} adjusted ${product.name} by ${input.quantityChange} (${input.reason}). New: ${newStock}`);
      return { success: true, newStock };
    }),
    lowStock: inventoryProcedure.input(z3.object({ threshold: z3.number().min(0).default(10) })).query(
      async ({ input }) => Product.find({ stockQuantity: { $lte: input.threshold }, isActive: true }).populate("categoryId", "name").lean()
    ),
    summary: inventoryProcedure.query(async () => getInventorySummary()),
    weeklySales: inventoryProcedure.query(async () => getWeeklySalesStats(7)),
    recentActivity: inventoryProcedure.input(paginationInput).query(
      async ({ input }) => Product.find({ isActive: true }).sort({ updatedAt: -1 }).skip(input.offset).limit(input.limit).select("name stockQuantity soldQuantity updatedAt").lean()
    )
  }),
  // ── STOCK MANAGER ─────────────────────────────────────────────────────────────
  stockManager: router({
    summary: stockManagerProcedure.query(async () => {
      const [totalProducts, lowStockProducts, outOfStockProducts] = await Promise.all([
        Product.countDocuments({ isActive: true }),
        Product.countDocuments({ isActive: true, stockQuantity: { $gt: 0, $lte: 10 } }),
        Product.countDocuments({ isActive: true, stockQuantity: 0 })
      ]);
      return { totalProducts, lowStockProducts, outOfStockProducts };
    }),
    products: stockManagerProcedure.input(paginationInput).query(
      async ({ input }) => Product.find({ isActive: true }).select("name stockQuantity soldQuantity categoryId images isFeatured").populate("categoryId", "name").skip(input.offset).limit(input.limit).lean()
    ),
    lowStockAlerts: stockManagerProcedure.input(z3.object({ threshold: z3.number().default(10) })).query(
      async ({ input }) => Product.find({ stockQuantity: { $lte: input.threshold }, isActive: true }).populate("categoryId", "name").sort({ stockQuantity: 1 }).lean()
    ),
    adjustStock: stockManagerProcedure.input(z3.object({
      productId: z3.string().refine((val) => mongoose8.Types.ObjectId.isValid(val), {
        message: "Invalid Product ID format"
      }),
      quantityChange: z3.number(),
      reason: z3.enum(["restock", "sale_adjustment", "damage", "return", "correction", "other"]),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const product = await Product.findById(input.productId);
      if (!product) throw new Error("Product not found");
      const newStock = product.stockQuantity + input.quantityChange;
      if (newStock < 0) throw new Error("Stock cannot go below zero");
      await Product.findByIdAndUpdate(input.productId, { stockQuantity: newStock });
      console.log(`[StockMgr] ${ctx.user.name} -> ${product.name}: ${input.quantityChange > 0 ? "+" : ""}${input.quantityChange} (${input.reason}). New: ${newStock}`);
      return { success: true, newStock };
    }),
    requestRestock: stockManagerProcedure.input(z3.object({
      productId: z3.string(),
      requestedQty: z3.number().min(1),
      urgency: z3.enum(["low", "medium", "high"]).default("medium"),
      notes: z3.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const product = await Product.findById(input.productId);
      if (!product) throw new Error("Product not found");
      console.log(`[RestockRequest] ${ctx.user.name} requested ${input.requestedQty}x "${product.name}" (${input.urgency})`);
      return { success: true, message: `Restock request submitted for ${product.name}` };
    })
  }),
  // ── DEVELOPER ────────────────────────────────────────────────────────────────
  developer: router({
    platformStats: developerProcedure.query(() => getPlatformStats()),
    salesStats: developerProcedure.query(() => getTotalSalesStats()),
    stores: router({
      list: developerProcedure.query(async () => {
        const admins = await User.find({ role: "admin" }).select("name email isActive createdAt").lean();
        return admins.map((a) => ({
          id: a._id.toString(),
          adminName: a.name,
          adminEmail: a.email,
          isActive: a.isActive,
          createdDate: a.createdAt,
          storeCode: `STORE-${a._id.toString().slice(-6).toUpperCase()}`,
          storeName: `${a.name}'s Store`
        }));
      }),
      create: developerProcedure.input(z3.object({
        adminName: z3.string().min(2),
        adminEmail: z3.string().email(),
        adminPassword: z3.string().min(8),
        phone: z3.string().optional(),
        storeName: z3.string().min(2)
      })).mutation(async ({ input }) => {
        const existing = await User.findOne({ email: input.adminEmail.toLowerCase() });
        if (existing) throw new Error("A user with this email already exists");
        const salt = await bcrypt3.genSalt(12);
        const passwordHash = await bcrypt3.hash(input.adminPassword, salt);
        const admin = await User.create({ name: input.adminName, email: input.adminEmail.toLowerCase(), passwordHash, phone: input.phone, role: "admin", isActive: true });
        return { success: true, adminId: admin._id.toString(), storeCode: `STORE-${admin._id.toString().slice(-6).toUpperCase()}` };
      }),
      toggle: developerProcedure.input(z3.object({ adminId: z3.string(), isActive: z3.boolean() })).mutation(async ({ input }) => {
        await User.findByIdAndUpdate(input.adminId, { isActive: input.isActive });
        return { success: true };
      })
    }),
    branches: router({
      list: developerProcedure.query(async () => {
        const managers = await User.find({ role: "manager" }).select("name email isActive createdAt city state").lean();
        return managers.map((m) => ({
          id: m._id.toString(),
          managerName: m.name,
          email: m.email,
          city: m.city ?? "\u2014",
          state: m.state ?? "\u2014",
          isActive: m.isActive,
          createdDate: m.createdAt,
          branchCode: `BR-${m._id.toString().slice(-6).toUpperCase()}`
        }));
      }),
      create: developerProcedure.input(z3.object({
        managerName: z3.string().min(2),
        managerEmail: z3.string().email(),
        managerPassword: z3.string().min(8),
        phone: z3.string().optional(),
        city: z3.string().optional(),
        state: z3.string().optional()
      })).mutation(async ({ input }) => {
        const existing = await User.findOne({ email: input.managerEmail.toLowerCase() });
        if (existing) throw new Error("A user with this email already exists");
        const salt = await bcrypt3.genSalt(12);
        const passwordHash = await bcrypt3.hash(input.managerPassword, salt);
        const manager = await User.create({ name: input.managerName, email: input.managerEmail.toLowerCase(), passwordHash, phone: input.phone, city: input.city, state: input.state, role: "manager", isActive: true });
        return { success: true, managerId: manager._id.toString(), branchCode: `BR-${manager._id.toString().slice(-6).toUpperCase()}` };
      }),
      toggle: developerProcedure.input(z3.object({ managerId: z3.string(), isActive: z3.boolean() })).mutation(async ({ input }) => {
        await User.findByIdAndUpdate(input.managerId, { isActive: input.isActive });
        return { success: true };
      })
    }),
    users: router({
      list: developerProcedure.input(z3.object({ role: z3.string().optional(), limit: z3.number().default(50), offset: z3.number().default(0) })).query(async ({ input }) => {
        const filter = input.role ? { role: input.role } : { role: { $in: ["admin", "manager", "stock_manager", "delivery", "developer"] } };
        return User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).skip(input.offset).limit(input.limit).lean();
      }),
      create: developerProcedure.input(z3.object({
        name: z3.string().min(2),
        email: z3.string().email(),
        password: z3.string().min(8),
        role: z3.enum(["admin", "manager", "stock_manager", "delivery"]),
        phone: z3.string().optional(),
        city: z3.string().optional(),
        state: z3.string().optional()
      })).mutation(async ({ input }) => {
        const existing = await User.findOne({ email: input.email.toLowerCase() });
        if (existing) throw new Error("A user with this email already exists");
        const salt = await bcrypt3.genSalt(12);
        const passwordHash = await bcrypt3.hash(input.password, salt);
        const user = await User.create({ name: input.name, email: input.email.toLowerCase(), passwordHash, phone: input.phone, city: input.city, state: input.state, role: input.role, isActive: true });
        return { success: true, userId: user._id.toString() };
      }),
      toggle: developerProcedure.input(z3.object({ userId: z3.string(), isActive: z3.boolean() })).mutation(async ({ input }) => {
        await User.findByIdAndUpdate(input.userId, { isActive: input.isActive });
        return { success: true };
      }),
      updateRole: developerProcedure.input(z3.object({ userId: z3.string(), role: z3.enum(["admin", "manager", "stock_manager", "delivery", "developer"]) })).mutation(async ({ input }) => {
        await User.findByIdAndUpdate(input.userId, { role: input.role });
        return { success: true };
      })
    })
  })
});

// server/_core/context.ts
init_User();
async function createContext(opts) {
  let user = null;
  try {
    const token = getSessionToken(opts.req);
    const session = await verifySessionToken(token);
    if (session?.userId) {
      user = await User.findById(session.userId).exec();
      if (user) {
        User.findByIdAndUpdate(session.userId, { lastSignedIn: /* @__PURE__ */ new Date() }).exec();
      }
    }
    if (!user) {
      const authHeader = Array.isArray(opts.req.headers.authorization) ? opts.req.headers.authorization[0] : opts.req.headers.authorization;
      const bearerToken = typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : void 0;
      if (bearerToken) {
        const firebasePayload = await verifyFirebaseIdToken(bearerToken);
        if (firebasePayload?.email) {
          user = await User.findOne({
            email: firebasePayload.email.toLowerCase().trim()
          }).exec();
          if (user) {
            User.findByIdAndUpdate(user._id, { lastSignedIn: /* @__PURE__ */ new Date() }).exec();
          }
        }
      }
    }
  } catch {
    user = null;
  }
  return { req: opts.req, res: opts.res, user };
}

// server/mongodb.ts
import mongoose9 from "mongoose";
import bcrypt4 from "bcryptjs";

// server/seedVirtualMall.ts
async function seedVirtualMall() {
  try {
    const fashionCat = await Category.findOneAndUpdate(
      { name: "Fashion" },
      { name: "Fashion", description: "Clothing and accessories" },
      { upsert: true, new: true }
    );
    const electronicsCat = await Category.findOneAndUpdate(
      { name: "Electronics" },
      { name: "Electronics", description: "Gadgets and devices" },
      { upsert: true, new: true }
    );
    const fashionStore = await Store.findOneAndUpdate(
      { name: "Fashion Avenue" },
      {
        name: "Fashion Avenue",
        category: "store",
        description: "Premium fashion boutique with the latest trends",
        bannerImageUrl: "https://picsum.photos/id/20/1200/400",
        buildingLevel: 1,
        marketingPitch: {
          headline: "Exclusive Virtual Runway",
          promoText: "Use code VIRTUAL15 for 15% off your first purchase",
          ctaLink: "/promo/fashion",
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
          // Example video
        },
        flyers: [{
          title: "Summer Clearance",
          description: "Up to 60% OFF on summer collection",
          imageUrl: "https://picsum.photos/id/26/400/250",
          validUntil: /* @__PURE__ */ new Date("2026-12-31")
        }]
      },
      { upsert: true, new: true }
    );
    const techStore = await Store.findOneAndUpdate(
      { name: "Tech Hub" },
      {
        name: "Tech Hub",
        category: "store",
        description: "Latest gadgets and electronics",
        bannerImageUrl: "https://picsum.photos/id/180/1200/400",
        buildingLevel: 1,
        marketingPitch: {
          headline: "Smart Shopping Experience",
          promoText: "Free tech consultation with every purchase",
          ctaLink: "/promo/tech"
        },
        flyers: [{
          title: "New Arrivals",
          description: "Check out our latest smartphone collection",
          imageUrl: "https://picsum.photos/id/250/400/250",
          validUntil: /* @__PURE__ */ new Date("2026-08-31")
        }]
      },
      { upsert: true, new: true }
    );
    const officeStore = await Store.findOneAndUpdate(
      { name: "Creative Office Solutions" },
      {
        name: "Creative Office Solutions",
        category: "office",
        description: "Office supplies and creative workspace solutions",
        bannerImageUrl: "https://picsum.photos/id/101/1200/400",
        buildingLevel: 2,
        marketingPitch: {
          headline: "Boost Your Productivity",
          promoText: "Office setup packages starting from \u20A650,000",
          ctaLink: "/promo/office"
        }
      },
      { upsert: true, new: true }
    );
    const products = [
      {
        name: "Silk Blouse",
        description: "Elegant silk blouse perfect for any occasion",
        categoryId: fashionCat._id,
        storeId: fashionStore._id,
        costPrice: 30,
        baseSalePrice: 75,
        commissionPercent: 10,
        stockQuantity: 50,
        images: ["https://picsum.photos/id/36/300/300"],
        arEnabled: true,
        limitedOffer: "Free Shipping"
      },
      {
        name: "Designer Jeans",
        description: "Premium denim jeans with perfect fit",
        categoryId: fashionCat._id,
        storeId: fashionStore._id,
        costPrice: 40,
        baseSalePrice: 120,
        commissionPercent: 10,
        stockQuantity: 30,
        images: ["https://picsum.photos/id/55/300/300"],
        arEnabled: false,
        limitedOffer: "Buy 1 Get 1 50% Off"
      },
      {
        name: "Wireless Headphones",
        description: "High-quality wireless headphones with noise cancellation",
        categoryId: electronicsCat._id,
        storeId: techStore._id,
        costPrice: 50,
        baseSalePrice: 150,
        commissionPercent: 15,
        stockQuantity: 25,
        images: ["https://picsum.photos/id/250/300/300"],
        arEnabled: false,
        limitedOffer: "Extended Warranty Included"
      },
      {
        name: "Smart Watch",
        description: "Feature-packed smartwatch for fitness and connectivity",
        categoryId: electronicsCat._id,
        storeId: techStore._id,
        costPrice: 80,
        baseSalePrice: 250,
        commissionPercent: 15,
        stockQuantity: 15,
        images: ["https://picsum.photos/id/180/300/300"],
        arEnabled: true,
        limitedOffer: "Bundle with Phone Case"
      },
      {
        name: "Office Chair",
        description: "Ergonomic office chair for comfortable work",
        categoryId: electronicsCat._id,
        // Using electronics for now, should create office category
        storeId: officeStore._id,
        costPrice: 100,
        baseSalePrice: 300,
        commissionPercent: 12,
        stockQuantity: 10,
        images: ["https://picsum.photos/id/101/300/300"],
        arEnabled: false,
        limitedOffer: "Free Desk Mat"
      }
    ];
    const createdProducts = [];
    for (const productData of products) {
      const finalPrice = productData.baseSalePrice * (1 + productData.commissionPercent / 100);
      const createdProduct = await Product.findOneAndUpdate(
        { name: productData.name },
        { ...productData, finalPrice },
        { upsert: true, new: true }
      );
      createdProducts.push(createdProduct);
    }
    await Store.findByIdAndUpdate(fashionStore._id, {
      $addToSet: { products: { $each: [createdProducts[0]._id, createdProducts[1]._id] } }
    });
    await Store.findByIdAndUpdate(techStore._id, {
      $addToSet: { products: { $each: [createdProducts[2]._id, createdProducts[3]._id] } }
    });
    await Store.findByIdAndUpdate(officeStore._id, {
      $addToSet: { products: { $each: [createdProducts[4]._id] } }
    });
    console.log("Virtual mall seeded successfully!");
  } catch (error) {
    console.error("Error seeding virtual mall:", error);
  }
}

// server/mongodb.ts
var isConnected = false;
async function connectDB() {
  if (isConnected) return;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn("[MongoDB] MONGODB_URI not set \u2014 database features disabled");
    return;
  }
  try {
    await mongoose9.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || "gimbiya_mall"
    });
    isConnected = true;
    console.log("[MongoDB] Connected successfully");
    mongoose9.connection.on("error", (err) => {
      console.error("[MongoDB] Connection error:", err);
      isConnected = false;
    });
    mongoose9.connection.on("disconnected", () => {
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
  const { User: User2 } = await Promise.resolve().then(() => (init_User(), User_exports));
  const staff = [
    { name: "Admin User", email: "admin@sahadstores.com", password: "Admin@123456", role: "admin" },
    { name: "Manager User", email: "manager@sahadstores.com", password: "Manager@123456", role: "manager" },
    { name: "Stock Manager", email: "stock@sahadstores.com", password: "Stock@123456", role: "stock_manager" },
    { name: "Delivery Rider", email: "delivery@sahadstores.com", password: "Delivery@123456", role: "delivery" },
    { name: "Developer User", email: "developer@sahadstores.com", password: "Developer@123456", role: "developer" }
  ];
  for (const s of staff) {
    const exists = await User2.findOne({ email: s.email });
    if (!exists) {
      const salt = await bcrypt4.genSalt(12);
      const passwordHash = await bcrypt4.hash(s.password, salt);
      await User2.create({ name: s.name, email: s.email, passwordHash, role: s.role, isActive: true });
      console.log(`[Seed] Created ${s.role} \u2192 ${s.email}`);
    }
  }
}

// server/_core/rateLimit.ts
var store = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1e3);
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}
function createRateLimiter(maxRequests, windowMs, keyPrefix = "rl") {
  return (req, res, next) => {
    const key = `${keyPrefix}:${getClientIp(req)}`;
    const now = Date.now();
    let entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1e3);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({ error: "Too many requests. Please slow down.", retryAfterSeconds: retryAfter });
    }
    res.setHeader("X-RateLimit-Remaining", maxRequests - entry.count);
    next();
  };
}
var authRateLimiter = createRateLimiter(10, 15 * 60 * 1e3, "auth");
var apiRateLimiter = createRateLimiter(200, 60 * 1e3, "api");

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid as nanoid3 } from "nanoid";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
function debugCollector() {
  return {
    name: "debug-collector",
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (c) => {
          body += c.toString();
        });
        req.on("end", () => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        });
      });
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss(), debugCollector()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  // Vite's root is the client folder (index.html lives there)
  root: path.resolve(__dirname, "client"),
  publicDir: path.resolve(__dirname, "client/public"),
  envDir: path.resolve(__dirname),
  // .env lives at project root
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: false
      // allow imports from shared/ which is outside client/
    }
  }
});

// server/_core/vite.ts
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid3()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(__dirname2, "../..", "dist", "public") : path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(start = 3e3) {
  for (let p = start; p < start + 20; p++) {
    if (await isPortAvailable(p)) return p;
  }
  throw new Error(`No available port found from ${start}`);
}
async function startServer() {
  await connectDB();
  const app = express2();
  const server = createServer(app);
  app.use("/api/trpc/auth", authRateLimiter);
  app.use("/api/trpc", apiRateLimiter);
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`Port ${preferredPort} busy, using ${port}`);
  server.listen(port, () => {
    console.log(`
\u{1F6CD}\uFE0F  Gimbiya Mall \u2192 http://localhost:${port}/`);
    console.log(`\u{1F4E6}  API         \u2192 http://localhost:${port}/api/trpc`);
    console.log(`
\u{1F464}  Staff Login Credentials:`);
    console.log(`   admin       admin@sahadstores.com      Admin@123456`);
    console.log(`   manager     manager@sahadstores.com    Manager@123456`);
    console.log(`   delivery    delivery@sahadstores.com   Delivery@123456`);
    console.log(`   developer   developer@sahadstores.com  Developer@123456`);
    console.log(`   buyer       register at /auth          (self-signup)
`);
  });
}
startServer().catch(console.error);
