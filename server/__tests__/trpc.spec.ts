import mongoose from 'mongoose';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import dotenv from 'dotenv';

dotenv.config();

let caller: any;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not set for tests');
  await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB_NAME || 'gimbiya_mall' });

  const { appRouter } = await import('../routers');
  const { User } = await import('../models/User');

  const user = await User.findOne({ role: 'stock_manager' }).lean();
  if (!user) throw new Error('No stock_manager user found for tests');

  caller = appRouter.createCaller({ req: {} as any, res: {} as any, user });
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('TRPC server integration', () => {
  it('fetches inventory summary and low stock alerts', async () => {
    const summary = await caller.inventory.summary();
    expect(summary).toHaveProperty('totalProducts');

    const alerts = await caller.stockManager.lowStockAlerts({ threshold: 10 });
    expect(Array.isArray(alerts)).toBe(true);
  });

  it('adjusts stock and requests restock', async () => {
    const alerts = await caller.stockManager.lowStockAlerts({ threshold: 10 });
    let productId = alerts[0]?._id?.toString();
    if (!productId) {
      const { Product } = await import('../models/Product');
      const p = await Product.findOne({ isActive: true }).lean();
      productId = p?._id?.toString();
    }
    expect(productId).toBeTruthy();

    const before = await caller.inventory.recentActivity({ limit: 5, offset: 0 });
    const res = await caller.stockManager.adjustStock({ productId, quantityChange: 1, reason: 'restock', notes: 'vitest' });
    expect(res).toHaveProperty('success', true);

    const reqRes = await caller.stockManager.requestRestock({ productId, requestedQty: 5, urgency: 'low', notes: 'vitest' });
    expect(reqRes).toHaveProperty('success', true);

    const after = await caller.inventory.recentActivity({ limit: 5, offset: 0 });
    expect(after.length).toBeGreaterThanOrEqual(1);
  }, 20000);
});
