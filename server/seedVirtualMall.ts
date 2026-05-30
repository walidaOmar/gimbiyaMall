import mongoose from 'mongoose';
import { Store } from './models/Store';
import { Product } from './models/Product';
import { Category } from './models/Category';

async function seedVirtualMall() {
  try {
    // Create categories if not exist
    const fashionCat = await Category.findOneAndUpdate(
      { name: 'Fashion' },
      { name: 'Fashion', description: 'Clothing and accessories' },
      { upsert: true, new: true }
    );

    const electronicsCat = await Category.findOneAndUpdate(
      { name: 'Electronics' },
      { name: 'Electronics', description: 'Gadgets and devices' },
      { upsert: true, new: true }
    );

    // Create stores
    const fashionStore = await Store.findOneAndUpdate(
      { name: 'Fashion Avenue' },
      {
        name: 'Fashion Avenue',
        category: 'store',
        description: 'Premium fashion boutique with the latest trends',
        bannerImageUrl: 'https://picsum.photos/id/20/1200/400',
        buildingLevel: 1,
        marketingPitch: {
          headline: 'Exclusive Virtual Runway',
          promoText: 'Use code VIRTUAL15 for 15% off your first purchase',
          ctaLink: '/promo/fashion',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Example video
        },
        flyers: [{
          title: 'Summer Clearance',
          description: 'Up to 60% OFF on summer collection',
          imageUrl: 'https://picsum.photos/id/26/400/250',
          validUntil: new Date('2026-12-31')
        }]
      },
      { upsert: true, new: true }
    );

    const techStore = await Store.findOneAndUpdate(
      { name: 'Tech Hub' },
      {
        name: 'Tech Hub',
        category: 'store',
        description: 'Latest gadgets and electronics',
        bannerImageUrl: 'https://picsum.photos/id/180/1200/400',
        buildingLevel: 1,
        marketingPitch: {
          headline: 'Smart Shopping Experience',
          promoText: 'Free tech consultation with every purchase',
          ctaLink: '/promo/tech',
        },
        flyers: [{
          title: 'New Arrivals',
          description: 'Check out our latest smartphone collection',
          imageUrl: 'https://picsum.photos/id/250/400/250',
          validUntil: new Date('2026-08-31')
        }]
      },
      { upsert: true, new: true }
    );

    const officeStore = await Store.findOneAndUpdate(
      { name: 'Creative Office Solutions' },
      {
        name: 'Creative Office Solutions',
        category: 'office',
        description: 'Office supplies and creative workspace solutions',
        bannerImageUrl: 'https://picsum.photos/id/101/1200/400',
        buildingLevel: 2,
        marketingPitch: {
          headline: 'Boost Your Productivity',
          promoText: 'Office setup packages starting from ₦50,000',
          ctaLink: '/promo/office',
        }
      },
      { upsert: true, new: true }
    );

    // Create products
    const products = [
      {
        name: 'Silk Blouse',
        description: 'Elegant silk blouse perfect for any occasion',
        categoryId: fashionCat._id,
        storeId: fashionStore._id,
        costPrice: 30,
        baseSalePrice: 75,
        commissionPercent: 10,
        stockQuantity: 50,
        images: ['https://picsum.photos/id/36/300/300'],
        arEnabled: true,
        limitedOffer: 'Free Shipping'
      },
      {
        name: 'Designer Jeans',
        description: 'Premium denim jeans with perfect fit',
        categoryId: fashionCat._id,
        storeId: fashionStore._id,
        costPrice: 40,
        baseSalePrice: 120,
        commissionPercent: 10,
        stockQuantity: 30,
        images: ['https://picsum.photos/id/55/300/300'],
        arEnabled: false,
        limitedOffer: 'Buy 1 Get 1 50% Off'
      },
      {
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        categoryId: electronicsCat._id,
        storeId: techStore._id,
        costPrice: 50,
        baseSalePrice: 150,
        commissionPercent: 15,
        stockQuantity: 25,
        images: ['https://picsum.photos/id/250/300/300'],
        arEnabled: false,
        limitedOffer: 'Extended Warranty Included'
      },
      {
        name: 'Smart Watch',
        description: 'Feature-packed smartwatch for fitness and connectivity',
        categoryId: electronicsCat._id,
        storeId: techStore._id,
        costPrice: 80,
        baseSalePrice: 250,
        commissionPercent: 15,
        stockQuantity: 15,
        images: ['https://picsum.photos/id/180/300/300'],
        arEnabled: true,
        limitedOffer: 'Bundle with Phone Case'
      },
      {
        name: 'Office Chair',
        description: 'Ergonomic office chair for comfortable work',
        categoryId: electronicsCat._id, // Using electronics for now, should create office category
        storeId: officeStore._id,
        costPrice: 100,
        baseSalePrice: 300,
        commissionPercent: 12,
        stockQuantity: 10,
        images: ['https://picsum.photos/id/101/300/300'],
        arEnabled: false,
        limitedOffer: 'Free Desk Mat'
      }
    ];

    const createdProducts = [];

    for (const productData of products) {
      const finalPrice = (productData.baseSalePrice * (1 + productData.commissionPercent / 100));
      const createdProduct = await Product.findOneAndUpdate(
        { name: productData.name },
        { ...productData, finalPrice },
        { upsert: true, new: true }
      );
      createdProducts.push(createdProduct);
    }

    // Update stores with products
    await Store.findByIdAndUpdate(fashionStore._id, {
      $addToSet: { products: { $each: [createdProducts[0]._id, createdProducts[1]._id] } }
    });

    await Store.findByIdAndUpdate(techStore._id, {
      $addToSet: { products: { $each: [createdProducts[2]._id, createdProducts[3]._id] } }
    });

    await Store.findByIdAndUpdate(officeStore._id, {
      $addToSet: { products: { $each: [createdProducts[4]._id] } }
    });

    console.log('Virtual mall seeded successfully!');
  } catch (error) {
    console.error('Error seeding virtual mall:', error);
  }
}

export { seedVirtualMall };