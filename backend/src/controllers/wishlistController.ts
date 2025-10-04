import { Request, Response } from 'express';
import Wishlist from '../models/Wishlist';
import Product from '../models/Product';

// Helper function to resolve product ID (handles both ObjectId and name-based slugs)
const resolveProductId = async (id: string) => {
  // Check if the id is a valid MongoDB ObjectId (24 hex characters)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  
  if (isObjectId) {
    // If it's a valid ObjectId, search by _id
    return await Product.findById(id);
  } else {
    // If it's not a valid ObjectId, treat it as a name-based slug
    // Convert slug back to name format (replace hyphens with spaces and capitalize)
    const nameFromSlug = id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Try multiple search strategies for better matching
    return await Product.findOne({
      $or: [
        // Exact match (case-insensitive)
        { name: { $regex: new RegExp(`^${nameFromSlug}$`, 'i') } },
        // Partial match (case-insensitive) - in case of slight differences
        { name: { $regex: new RegExp(nameFromSlug.replace(/\s+/g, '\\s*'), 'i') } },
        // Match with original slug format
        { name: { $regex: new RegExp(`^${id.replace(/-/g, '\\s*')}$`, 'i') } }
      ]
    });
  }
};

// Get user's wishlist
export const getUserWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const wishlistItems = await Wishlist.find({ user: userId })
      .populate({
        path: 'product',
        select: 'name description price imageUrl images stock category',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await Wishlist.countDocuments({ user: userId });

    res.json({
      wishlistItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        hasNextPage: page < Math.ceil(totalItems / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add item to wishlist
export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = (req as any).user.id;

    // Check if product exists using helper function
    const product = await resolveProductId(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Use the actual product ID for database queries
    const actualProductId = product._id.toString();

    // Check if item is already in wishlist
    const existingItem = await Wishlist.findOne({ user: userId, product: actualProductId });
    if (existingItem) {
      return res.status(400).json({ message: 'Product is already in your wishlist' });
    }

    // Add to wishlist
    const wishlistItem = new Wishlist({
      user: userId,
      product: actualProductId,
    });

    await wishlistItem.save();
    await wishlistItem.populate({
      path: 'product',
      select: 'name description price imageUrl images stock category',
    });

    res.status(201).json({
      message: 'Product added to wishlist successfully',
      wishlistItem,
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = (req as any).user.id;

    const wishlistItem = await Wishlist.findOneAndDelete({ user: userId, product: productId });
    if (!wishlistItem) {
      return res.status(404).json({ message: 'Product not found in your wishlist' });
    }

    res.json({ message: 'Product removed from wishlist successfully' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if product is in wishlist
export const checkWishlistStatus = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = (req as any).user.id;

    // Check if product exists using helper function
    const product = await resolveProductId(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Use the actual product ID for database queries
    const actualProductId = product._id.toString();

    const wishlistItem = await Wishlist.findOne({ user: userId, product: actualProductId });
    
    res.json({ 
      isInWishlist: !!wishlistItem,
      wishlistItem: wishlistItem || null
    });
  } catch (error) {
    console.error('Check wishlist status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle wishlist status (add if not present, remove if present)
export const toggleWishlist = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = (req as any).user.id;

    // Check if product exists using helper function
    const product = await resolveProductId(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Use the actual product ID for database queries
    const actualProductId = product._id.toString();

    // Check if item is already in wishlist
    const existingItem = await Wishlist.findOne({ user: userId, product: actualProductId });
    
    if (existingItem) {
      // Remove from wishlist
      await Wishlist.findByIdAndDelete(existingItem._id);
      res.json({ 
        message: 'Product removed from wishlist',
        isInWishlist: false,
        action: 'removed'
      });
    } else {
      // Add to wishlist
      const wishlistItem = new Wishlist({
        user: userId,
        product: actualProductId,
      });
      await wishlistItem.save();
      await wishlistItem.populate({
      path: 'product',
      select: 'name description price imageUrl images stock category',
    });
      
      res.json({ 
        message: 'Product added to wishlist',
        isInWishlist: true,
        action: 'added',
        wishlistItem
      });
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
