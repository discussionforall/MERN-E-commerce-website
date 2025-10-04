import { Request, Response } from 'express';
import Category from '../models/Category';
import Product from '../models/Product';
import { AuthRequest } from '../types';

// Get all categories (public and admin)
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find()
      .sort({ name: 1 })
      .select('-__v');

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new category (admin only)
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.status(400).json({
        message: 'Category name already exists'
      });
    }

    const category = new Category({ name });
    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
};

// Update category (admin only)
export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        _id: { $ne: id },
        name
      });

      if (existingCategory) {
        return res.status(400).json({
          message: 'Category name already exists'
        });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory,
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
};
