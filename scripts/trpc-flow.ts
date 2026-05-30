import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB_NAME || 'gimbiya_mall' });
  console.log('[trpc-script] Connected to MongoDB');

  const { appRouter } = await import('../server/routers');
  const { User } = await import('../server/models/User');

  // find a stock_manager user
  const user = await User.findOne({ role: 'stock_manager' }).lean();
  if (!user) {
    console.error('No stock_manager user found.');
    process.exit(1);
  }

  const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user });

  console.log('[trpc-script] Fetching inventory summary...');
  const summary = await caller.inventory.summary();
  console.log('inventory.summary =>', summary);

  console.log('[trpc-script] Fetching low stock alerts (threshold 10)...');
  const alerts = await caller.stockManager.lowStockAlerts({ threshold: 10 });
  console.log('stockManager.lowStockAlerts => count', alerts.length);

  // pick a product from alerts or any active product
  let productId: string | undefined = alerts[0]?._id?.toString();
  if (!productId) {
    const { Product } = await import('../server/models/Product');
    const p = await Product.findOne({ isActive: true }).lean();
    productId = p?._id?.toString();
  }

  if (!productId) {
    console.error('No product found to adjust');
    process.exit(1);
  }

  console.log('[trpc-script] Adjusting stock for', productId);
  const res = await caller.stockManager.adjustStock({ productId, quantityChange: 3, reason: 'restock', notes: 'script test' });
  console.log('adjustStock =>', res);

  console.log('[trpc-script] Requesting restock for', productId);
  const reqRes = await caller.stockManager.requestRestock({ productId, requestedQty: 20, urgency: 'medium', notes: 'script test' });
  console.log('requestRestock =>', reqRes);

  console.log('[trpc-script] Fetching recent inventory activity...');
  const recent = await caller.inventory.recentActivity({ limit: 5, offset: 0 });
  console.log('inventory.recentActivity =>', recent.map((r: any) => ({ id: r._id, stock: r.stockQuantity })));

  await mongoose.disconnect();
  console.log('[trpc-script] Done');
}

main().catch((err) => { console.error(err); process.exit(1); });
