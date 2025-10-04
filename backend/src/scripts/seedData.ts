import mongoose from 'mongoose';
import User from '../models/User';
import Product from '../models/Product';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - remove this in production)
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin123',
      role: 'admin',
    });
    await adminUser.save();
    console.log('✅ Admin user created');

    // Create regular user
    const regularUser = new User({
      username: 'user1',
      email: 'user@example.com',
      password: 'User123',
      role: 'user',
    });
    await regularUser.save();
    console.log('✅ Regular user created');

    // Create sample products
    const sampleProducts = [
      // Electronics (10 products)
      {
        name: 'Wireless Bluetooth Headphones',
        description:
          'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
        price: 199.99,
        category: 'electronics',
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        stock: 50,
        createdBy: adminUser._id,
      },
      {
        name: 'iPhone 15 Pro',
        description:
          'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system.',
        price: 999.99,
        category: 'electronics',
        imageUrl:
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
        stock: 25,
        createdBy: adminUser._id,
      },
      {
        name: 'MacBook Air M2',
        description:
          'Ultra-thin laptop with M2 chip, 13-inch Retina display, and all-day battery life.',
        price: 1199.99,
        category: 'electronics',
        imageUrl:
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        stock: 15,
        createdBy: adminUser._id,
      },
      {
        name: 'Samsung 4K Smart TV',
        description:
          '55-inch 4K UHD Smart TV with HDR10+ and built-in streaming apps.',
        price: 699.99,
        category: 'electronics',
        imageUrl:
          'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500',
        stock: 20,
        createdBy: adminUser._id,
      },
      {
        name: 'Gaming Mechanical Keyboard',
        description:
          'RGB backlit mechanical keyboard with Cherry MX switches for gaming.',
        price: 149.99,
        category: 'electronics',
        imageUrl:
          'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500',
        stock: 35,
        createdBy: adminUser._id,
      },
      {
        name: 'Wireless Gaming Mouse',
        description:
          'High-precision wireless gaming mouse with 25,000 DPI and RGB lighting.',
        price: 79.99,
        category: 'electronics',
        imageUrl:
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
        stock: 40,
        createdBy: adminUser._id,
      },
      {
        name: 'Bluetooth Speaker',
        description:
          'Portable waterproof Bluetooth speaker with 360-degree sound and 12-hour battery.',
        price: 89.99,
        category: 'electronics',
        imageUrl:
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
        stock: 60,
        createdBy: adminUser._id,
      },
      {
        name: 'Smart Watch Series 9',
        description:
          'Advanced smartwatch with health monitoring, GPS, and cellular connectivity.',
        price: 399.99,
        category: 'electronics',
        imageUrl:
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        stock: 30,
        createdBy: adminUser._id,
      },
      {
        name: 'Tablet Pro 12.9"',
        description:
          'Professional tablet with M2 chip, Liquid Retina XDR display, and Apple Pencil support.',
        price: 1099.99,
        category: 'electronics',
        imageUrl:
          'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500',
        stock: 18,
        createdBy: adminUser._id,
      },
      {
        name: 'Noise Cancelling Earbuds',
        description:
          'True wireless earbuds with active noise cancellation and 6-hour battery life.',
        price: 179.99,
        category: 'electronics',
        imageUrl:
          'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500',
        stock: 45,
        createdBy: adminUser._id,
      },

      // Clothing (8 products)
      {
        name: 'Cotton T-Shirt',
        description:
          'Comfortable 100% cotton t-shirt available in multiple colors and sizes.',
        price: 29.99,
        category: 'clothing',
        imageUrl:
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        stock: 100,
        createdBy: adminUser._id,
      },
      {
        name: 'Denim Jeans',
        description:
          'Classic blue denim jeans with stretch fabric for comfort and style.',
        price: 79.99,
        category: 'clothing',
        imageUrl:
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
        stock: 75,
        createdBy: adminUser._id,
      },
      {
        name: 'Hoodie Sweatshirt',
        description:
          'Cozy fleece hoodie with kangaroo pocket and adjustable drawstring hood.',
        price: 59.99,
        category: 'clothing',
        imageUrl:
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
        stock: 50,
        createdBy: adminUser._id,
      },
      {
        name: 'Leather Jacket',
        description:
          'Genuine leather jacket with classic biker style and multiple pockets.',
        price: 199.99,
        category: 'clothing',
        imageUrl:
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
        stock: 25,
        createdBy: adminUser._id,
      },
      {
        name: 'Running Sneakers',
        description:
          'Lightweight running shoes with breathable mesh upper and cushioned sole.',
        price: 129.99,
        category: 'clothing',
        imageUrl:
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
        stock: 80,
        createdBy: adminUser._id,
      },
      {
        name: 'Summer Dress',
        description:
          'Elegant floral summer dress perfect for casual and semi-formal occasions.',
        price: 69.99,
        category: 'clothing',
        imageUrl:
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500',
        stock: 40,
        createdBy: adminUser._id,
      },
      {
        name: 'Winter Coat',
        description:
          'Warm winter coat with water-resistant outer shell and insulated lining.',
        price: 149.99,
        category: 'clothing',
        imageUrl:
          'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500',
        stock: 35,
        createdBy: adminUser._id,
      },
      {
        name: 'Baseball Cap',
        description:
          'Adjustable baseball cap with embroidered logo and curved brim.',
        price: 24.99,
        category: 'clothing',
        imageUrl:
          'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
        stock: 90,
        createdBy: adminUser._id,
      },

      // Books (6 products)
      {
        name: 'JavaScript: The Good Parts',
        description:
          'Essential guide to JavaScript programming by Douglas Crockford.',
        price: 39.99,
        category: 'books',
        imageUrl:
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
        stock: 25,
        createdBy: adminUser._id,
      },
      {
        name: 'Clean Code',
        description:
          'A Handbook of Agile Software Craftsmanship by Robert C. Martin.',
        price: 44.99,
        category: 'books',
        imageUrl:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
        stock: 30,
        createdBy: adminUser._id,
      },
      {
        name: 'The Great Gatsby',
        description:
          'Classic American novel by F. Scott Fitzgerald in paperback edition.',
        price: 12.99,
        category: 'books',
        imageUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
        stock: 50,
        createdBy: adminUser._id,
      },
      {
        name: 'Sapiens: A Brief History of Humankind',
        description:
          'Fascinating exploration of human history by Yuval Noah Harari.',
        price: 18.99,
        category: 'books',
        imageUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
        stock: 40,
        createdBy: adminUser._id,
      },
      {
        name: 'Atomic Habits',
        description:
          'An Easy & Proven Way to Build Good Habits & Break Bad Ones by James Clear.',
        price: 16.99,
        category: 'books',
        imageUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
        stock: 35,
        createdBy: adminUser._id,
      },
      {
        name: 'The Psychology of Money',
        description:
          'Timeless lessons on wealth, greed, and happiness by Morgan Housel.',
        price: 14.99,
        category: 'books',
        imageUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
        stock: 45,
        createdBy: adminUser._id,
      },

      // Home (6 products)
      {
        name: 'Smart Home LED Bulbs',
        description:
          'WiFi-enabled LED bulbs that can be controlled via smartphone app.',
        price: 49.99,
        category: 'home',
        imageUrl:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
        stock: 30,
        createdBy: adminUser._id,
      },
      {
        name: 'Coffee Maker',
        description:
          'Programmable drip coffee maker with 12-cup capacity and auto-shutoff.',
        price: 89.99,
        category: 'home',
        imageUrl:
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
        stock: 25,
        createdBy: adminUser._id,
      },
      {
        name: 'Throw Pillows Set',
        description:
          'Set of 4 decorative throw pillows with modern geometric patterns.',
        price: 39.99,
        category: 'home',
        imageUrl:
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        stock: 60,
        createdBy: adminUser._id,
      },
      {
        name: 'Air Purifier',
        description:
          'HEPA air purifier with 3-stage filtration and smart sensor technology.',
        price: 199.99,
        category: 'home',
        imageUrl:
          'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=500',
        stock: 20,
        createdBy: adminUser._id,
      },
      {
        name: 'Kitchen Knife Set',
        description:
          'Professional 8-piece stainless steel knife set with wooden block.',
        price: 129.99,
        category: 'home',
        imageUrl:
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500',
        stock: 35,
        createdBy: adminUser._id,
      },
      {
        name: 'Vacuum Cleaner',
        description:
          'Cordless stick vacuum with powerful suction and 40-minute runtime.',
        price: 299.99,
        category: 'home',
        imageUrl:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
        stock: 15,
        createdBy: adminUser._id,
      },

      // Sports (6 products)
      {
        name: 'Yoga Mat',
        description:
          'Non-slip yoga mat perfect for home workouts and meditation.',
        price: 34.99,
        category: 'sports',
        imageUrl:
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500',
        stock: 40,
        createdBy: adminUser._id,
      },
      {
        name: 'Dumbbell Set',
        description:
          'Adjustable dumbbell set with weights from 5-50 lbs for home gym.',
        price: 199.99,
        category: 'sports',
        imageUrl:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
        stock: 20,
        createdBy: adminUser._id,
      },
      {
        name: 'Basketball',
        description:
          'Official size and weight basketball for indoor and outdoor play.',
        price: 29.99,
        category: 'sports',
        imageUrl:
          'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500',
        stock: 50,
        createdBy: adminUser._id,
      },
      {
        name: 'Tennis Racket',
        description:
          'Professional tennis racket with graphite frame and synthetic strings.',
        price: 149.99,
        category: 'sports',
        imageUrl:
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500',
        stock: 30,
        createdBy: adminUser._id,
      },
      {
        name: 'Resistance Bands Set',
        description:
          'Set of 5 resistance bands with different resistance levels for full-body workouts.',
        price: 24.99,
        category: 'sports',
        imageUrl:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
        stock: 70,
        createdBy: adminUser._id,
      },
      {
        name: 'Water Bottle',
        description:
          'Insulated stainless steel water bottle that keeps drinks cold for 24 hours.',
        price: 19.99,
        category: 'sports',
        imageUrl:
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
        stock: 100,
        createdBy: adminUser._id,
      },

      // Beauty (4 products)
      {
        name: 'Skincare Set',
        description:
          'Complete skincare routine set with cleanser, toner, and moisturizer.',
        price: 79.99,
        category: 'beauty',
        imageUrl:
          'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
        stock: 40,
        createdBy: adminUser._id,
      },
      {
        name: 'Makeup Brush Set',
        description:
          'Professional 12-piece makeup brush set with synthetic bristles.',
        price: 49.99,
        category: 'beauty',
        imageUrl:
          'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
        stock: 35,
        createdBy: adminUser._id,
      },
      {
        name: 'Hair Dryer',
        description:
          'Professional hair dryer with ionic technology and multiple heat settings.',
        price: 89.99,
        category: 'beauty',
        imageUrl:
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
        stock: 25,
        createdBy: adminUser._id,
      },
      {
        name: 'Perfume Gift Set',
        description:
          'Luxury perfume gift set with 3 different fragrances in travel sizes.',
        price: 69.99,
        category: 'beauty',
        imageUrl:
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
        stock: 30,
        createdBy: adminUser._id,
      },
    ];

    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
    }
    console.log('✅ Sample products created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('👑 Admin: admin@example.com / Admin123');
    console.log('👤 User: user@example.com / User123');
    console.log('\n🛍️  Sample products have been created for testing');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

seedData();
