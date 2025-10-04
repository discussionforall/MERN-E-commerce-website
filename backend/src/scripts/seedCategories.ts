import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category';

// Load environment variables
dotenv.config();

const categories = [
  { name: 'Electronics' },
  { name: 'Clothing' },
  { name: 'Books' },
  { name: 'Home' },
  { name: 'Sports' },
  { name: 'Beauty' },
  { name: 'Other' },
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories one by one
    const createdCategories = [];
    for (const categoryData of categories) {
      const category = new Category(categoryData);
      await category.save();
      createdCategories.push(category);
      console.log(`- ${category.name}`);
    }
    
    console.log(`Created ${createdCategories.length} categories`);

    console.log('Category seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seeding function
seedCategories();
