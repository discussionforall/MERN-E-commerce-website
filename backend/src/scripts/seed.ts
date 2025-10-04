import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log('📧 Email: admin@example.com');
      console.log('🔑 Password: Admin123');
      console.log('👑 Role: admin');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin123',
      role: 'admin',
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: Admin123');
    console.log('👑 Role: admin');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

seedAdmin();
