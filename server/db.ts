/**
 * MongoDB database helpers
 * Replaces the old Drizzle / MySQL db.ts entirely.
 */

import mongoose from "mongoose";
import { User, type IUser } from "./models/User";
import { Product, type IProduct } from "./models/Product";
import { Category, type ICategory } from "./models/Category";
import { Order, type IOrder } from "./models/Order";
import { CartItem } from "./models/CartItem";

// ─── Connection ──────────────────────────────────────────────────────────────

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<IUser | null> {
  return User.findById(id).lean<IUser>();
}

export async function getAllUsers(
  role?: string,
  limit = 50,
  offset = 0
): Promise<IUser[]> {
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  return User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean<IUser[]>();
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { role });
}

export async function setUserAffiliate(userId: string, isAffiliate: boolean): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    isAffiliate,
    role: isAffiliate ? "reader" : "buyer",
  });
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function getProductById(id: string): Promise<IProduct | null> {
  return Product.findById(id).populate("categoryId").lean<IProduct>();
}

export async function getFeaturedProducts(limit = 10): Promise<IProduct[]> {
  return Product.find({ isFeatured: true, isActive: true })
    .populate("categoryId")
    .limit(limit)
    .lean<IProduct[]>();
}

export async function getProductsByCategory(
  categoryId: string,
  limit = 20,
  offset = 0
): Promise<IProduct[]> {
  return Product.find({ categoryId, isActive: true })
    .skip(offset)
    .limit(limit)
    .lean<IProduct[]>();
}

export async function searchProducts(
  query: string,
  limit = 20,
  offset = 0
): Promise<IProduct[]> {
  return Product.find({ $text: { $search: query }, isActive: true })
    .skip(offset)
    .limit(limit)
    .lean<IProduct[]>();
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getAllCategories(): Promise<ICategory[]> {
  return Category.find({ isActive: true }).lean<ICategory[]>();
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export async function getCartItems(userId: string) {
  return CartItem.find({ userId }).populate("productId").lean();
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number
): Promise<void> {
  await CartItem.findOneAndUpdate(
    { userId, productId },
    { $inc: { quantity } },
    { upsert: true, new: true }
  );
}

export async function removeFromCart(cartItemId: string): Promise<void> {
  await CartItem.findByIdAndDelete(cartItemId);
}

export async function clearCart(userId: string): Promise<void> {
  await CartItem.deleteMany({ userId });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getUserOrders(
  userId: string,
  limit = 20,
  offset = 0
): Promise<IOrder[]> {
  return Order.find({ buyerId: userId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean<IOrder[]>();
}

export async function getOrderByOrderId(orderId: string): Promise<IOrder | null> {
  return Order.findOne({ orderId }).lean<IOrder>();
}

export async function getDeliveryOrders(
  riderId: string,
  limit = 20,
  offset = 0
): Promise<IOrder[]> {
  return Order.find({ deliveryRiderId: riderId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("buyerId", "name phone")
    .lean<IOrder[]>();
}

// ─── Platform stats ──────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const [totalUsers, totalBuyers, totalProducts, totalOrders, deliveredOrders, activeUsers, suspendedAccounts] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "buyer" }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: "delivered" }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
    ]);

  const revenueAgg = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$finalAmount" } } },
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
    pendingApprovals: 0,
  };
}

export async function getTotalSalesStats() {
  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const salesAgg = await Order.aggregate([
    { $match: { paymentStatus: "paid", createdAt: { $gte: firstMonth } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        revenue: { $sum: "$finalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const statusAgg = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
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
      orders: match?.orders ?? 0,
    };
  });

  const statusMap = statusAgg.reduce<Record<string, number>>((acc, item) => {
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
    cancelledOrders: statusMap.cancelled ?? 0,
  };
}

export async function getInventorySummary(threshold = 10) {
  const [totalProducts, activeProducts, inactiveProducts, lowStockItems, totalStockValueAgg] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: false }),
    Product.countDocuments({ isActive: true, stockQuantity: { $lte: threshold } }),
    Product.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$stockQuantity", "$baseSalePrice"] } },
        },
      },
    ]),
  ]);

  return {
    totalProducts,
    activeProducts,
    inactiveProducts,
    lowStockItems,
    totalStockValue: totalStockValueAgg[0]?.totalValue ?? 0,
  };
}

export async function getWeeklySalesStats(days = 7) {
  const now = new Date();
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
          day: { $dayOfMonth: "$createdAt" },
        },
        revenue: { $sum: "$finalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  const trend = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const label = date.toLocaleDateString("en-US", { weekday: "short" });
    const match = salesAgg.find((item) =>
      item._id.year === date.getFullYear() && item._id.month === date.getMonth() + 1 && item._id.day === date.getDate()
    );
    return {
      day: label,
      revenue: match?.revenue ?? 0,
      orders: match?.orders ?? 0,
    };
  });

  return {
    totalRevenue: trend.reduce((sum, item) => sum + item.revenue, 0),
    totalOrders: trend.reduce((sum, item) => sum + item.orders, 0),
    trend,
  };
}
