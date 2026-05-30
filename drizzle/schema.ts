import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Enhanced user table with role-based access control
 * Supports 6 roles: admin, manager, delivery, reader, buyer, developer
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "manager", "delivery", "reader", "buyer", "developer"]).default("buyer").notNull(),
  profileImage: text("profileImage"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zipCode", { length: 20 }),
  country: varchar("country", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Product categories for organizing products
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Products with pricing, cost, and commission information
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: int("categoryId").notNull(),
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }).notNull(),
  baseSalePrice: decimal("baseSalePrice", { precision: 10, scale: 2 }).notNull(),
  commissionPercent: decimal("commissionPercent", { precision: 5, scale: 2 }).default("10").notNull(),
  finalPrice: decimal("finalPrice", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: int("stockQuantity").default(0).notNull(),
  soldQuantity: int("soldQuantity").default(0).notNull(),
  images: text("images").notNull().default("[]"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("categoryIdx").on(table.categoryId),
  createdByIdx: index("createdByIdx").on(table.createdBy),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Inventory logs for tracking stock changes
 */
export const inventoryLogs = mysqlTable("inventoryLogs", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  quantityChange: int("quantityChange").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("productIdx").on(table.productId),
}));

export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type InsertInventoryLog = typeof inventoryLogs.$inferInsert;

/**
 * Shopping cart items for users
 */
export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull().default(1),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
}));

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

/**
 * Orders placed by buyers
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 50 }).notNull().unique(),
  buyerId: int("buyerId").notNull(),
  referrerId: int("referrerId"),
  deliveryId: int("deliveryId"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  finalAmount: decimal("finalAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "processing", "assigned", "in_transit", "delivered", "cancelled"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  shippingAddress: text("shippingAddress").notNull(),
  shippingCity: varchar("shippingCity", { length: 100 }).notNull(),
  shippingState: varchar("shippingState", { length: 100 }),
  shippingZipCode: varchar("shippingZipCode", { length: 20 }),
  shippingCountry: varchar("shippingCountry", { length: 100 }).notNull(),
  buyerPhone: varchar("buyerPhone", { length: 20 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
}, (table) => ({
  buyerIdx: index("buyerIdx").on(table.buyerId),
  statusIdx: index("statusIdx").on(table.status),
  deliveryIdx: index("deliveryIdx").on(table.deliveryId),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items (products in an order)
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  costPrice: decimal("costPrice", { precision: 10, scale: 2 }).notNull(),
  baseSalePrice: decimal("baseSalePrice", { precision: 10, scale: 2 }).notNull(),
  commissionPercent: decimal("commissionPercent", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).notNull(),
  finalPrice: decimal("finalPrice", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
}, (table) => ({
  orderIdx: index("orderIdx").on(table.orderId),
}));

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Commission ledger for tracking all commission splits
 */
export const commissionLedger = mysqlTable("commissionLedger", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  orderItemId: int("orderItemId"),
  adminProfit: decimal("adminProfit", { precision: 12, scale: 2 }).default("0").notNull(),
  developerCommission: decimal("developerCommission", { precision: 12, scale: 2 }).default("0").notNull(),
  readerCommission: decimal("readerCommission", { precision: 12, scale: 2 }).default("0").notNull(),
  deliveryCommission: decimal("deliveryCommission", { precision: 12, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orderIdx: index("orderIdx").on(table.orderId),
}));

export type CommissionLedger = typeof commissionLedger.$inferSelect;
export type InsertCommissionLedger = typeof commissionLedger.$inferInsert;

/**
 * User wallets for holding funds
 */
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  totalEarned: decimal("totalEarned", { precision: 12, scale: 2 }).default("0").notNull(),
  totalWithdrawn: decimal("totalWithdrawn", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

/**
 * Referral links for affiliates/readers
 */
export const referralLinks = mysqlTable("referralLinks", {
  id: int("id").autoincrement().primaryKey(),
  readerId: int("readerId").notNull(),
  referralCode: varchar("referralCode", { length: 50 }).notNull().unique(),
  totalClicks: int("totalClicks").default(0).notNull(),
  totalConversions: int("totalConversions").default(0).notNull(),
  totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  readerIdx: index("readerIdx").on(table.readerId),
}));

export type ReferralLink = typeof referralLinks.$inferSelect;
export type InsertReferralLink = typeof referralLinks.$inferInsert;

/**
 * Delivery tracking information
 */
export const deliveryTracking = mysqlTable("deliveryTracking", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  deliveryId: int("deliveryId").notNull(),
  status: mysqlEnum("status", ["assigned", "picked", "in_transit", "delivered"]).default("assigned").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  estimatedDeliveryTime: timestamp("estimatedDeliveryTime"),
  actualDeliveryTime: timestamp("actualDeliveryTime"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orderIdx: index("orderIdx").on(table.orderId),
  deliveryIdx: index("deliveryIdx").on(table.deliveryId),
}));

export type DeliveryTracking = typeof deliveryTracking.$inferSelect;
export type InsertDeliveryTracking = typeof deliveryTracking.$inferInsert;

/**
 * Platform settings and configuration
 */
export const platformSettings = mysqlTable("platformSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = typeof platformSettings.$inferInsert;

/**
 * Promotional banners for platform managers
 */
export const promotionalBanners = mysqlTable("promotionalBanners", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  image: text("image").notNull(),
  link: text("link"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  position: int("position").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  activeIdx: index("activeIdx").on(table.isActive),
}));

export type PromotionalBanner = typeof promotionalBanners.$inferSelect;
export type InsertPromotionalBanner = typeof promotionalBanners.$inferInsert;

/**
 * Product reviews and ratings
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  buyerId: int("buyerId").notNull(),
  orderId: int("orderId").notNull(),
  rating: int("rating").notNull(),
  title: varchar("title", { length: 255 }),
  comment: text("comment"),
  images: text("images").notNull().default("[]"),
  isVerified: boolean("isVerified").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("productIdx").on(table.productId),
  buyerIdx: index("buyerIdx").on(table.buyerId),
}));

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Stores managed by admins (multi-tenant architecture)
 */
export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  storeCode: varchar("storeCode", { length: 50 }).notNull().unique(),
  storeName: varchar("storeName", { length: 255 }).notNull(),
  adminId: int("adminId").notNull(),
  developerId: int("developerId").notNull(),
  description: text("description"),
  logo: text("logo"),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  adminIdx: index("adminIdx").on(table.adminId),
  developerIdx: index("developerIdx").on(table.developerId),
}));

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

/**
 * Store branches with locations
 */
export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  branchCode: varchar("branchCode", { length: 50 }).notNull().unique(),
  storeId: int("storeId").notNull(),
  branchName: varchar("branchName", { length: 255 }).notNull(),
  managerId: int("managerId"),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zipCode", { length: 20 }),
  country: varchar("country", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeIdx: index("storeIdx").on(table.storeId),
  managerIdx: index("managerIdx").on(table.managerId),
}));

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

/**
 * Manager assignments to stores and branches
 */
export const managerAssignments = mysqlTable("managerAssignments", {
  id: int("id").autoincrement().primaryKey(),
  managerId: int("managerId").notNull(),
  storeId: int("storeId").notNull(),
  branchId: int("branchId"),
  assignmentType: mysqlEnum("assignmentType", ["store", "branch"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  managerIdx: index("managerIdx").on(table.managerId),
  storeIdx: index("storeIdx").on(table.storeId),
  branchIdx: index("branchIdx").on(table.branchId),
}));

export type ManagerAssignment = typeof managerAssignments.$inferSelect;
export type InsertManagerAssignment = typeof managerAssignments.$inferInsert;

/**
 * Store credentials for admin/manager login
 */
export const storeCredentials = mysqlTable("storeCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  storeId: int("storeId").notNull(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
  storeIdx: index("storeIdx").on(table.storeId),
}));

export type StoreCredential = typeof storeCredentials.$inferSelect;
export type InsertStoreCredential = typeof storeCredentials.$inferInsert;
