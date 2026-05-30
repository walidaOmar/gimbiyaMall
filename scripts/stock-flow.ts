import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const prodMod = await import('../server/models/Product');
const dbMod = await import('../server/db');
const Product = prodMod.Product;
const getInventorySummary = dbMod.getInventorySummary;

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not set in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB_NAME || 'gimbiya_mall' });
  console.log('[Script] Connected to MongoDB');

  const product = await Product.findOne({ isActive: true }).lean();
  if (!product) {
    console.error('No active products found');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`[Script] Selected product: ${product._id} - ${product.name} (stock: ${product.stockQuantity})`);

  const inc = 5;
  console.log(`[Script] Increasing stock by ${inc}...`);
  const updated = await Product.findByIdAndUpdate(product._id, { $inc: { stockQuantity: inc } }, { new: true }).lean();

  console.log(`[Script] New stock: ${updated?.stockQuantity}`);

  const summary = await getInventorySummary();
  console.log('[Script] Inventory summary:', summary);

  await mongoose.disconnect();
  console.log('[Script] Done');
}

main().catch((err) => { console.error(err); process.exit(1); });
