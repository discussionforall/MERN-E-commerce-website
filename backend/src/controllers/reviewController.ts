import { Request, Response } from 'express';
import Review from '../models/Review';
import Product from '../models/Product';
import { body, validationResult } from 'express-validator';
import { getSocketIO } from '../services/socketService';

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

// Helper function to calculate average rating
const calculateAverageRating = async (productId: string) => {
  const result = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: null, averageRating: { $avg: '$rating' } } },
  ]);

  // Handle case when no reviews exist (aggregation returns empty array)
  let averageRating = 0;

  if (result.length > 0 && result[0]) {
    averageRating = result[0].averageRating || 0;
  }

  return averageRating;
};

// Get reviews for a product
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Check if product exists using helper function
    const product = await resolveProductId(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Use the actual product ID for database queries
    const actualProductId = product._id.toString();

    // Get reviews with user information
    const reviews = await Review.find({ product: actualProductId })
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({ product: actualProductId });

    // Calculate average rating
    const averageRatingResult = await Review.aggregate([
      { $match: { product: actualProductId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // Handle case when no reviews exist (aggregation returns empty array)
    let averageRating = 0;
    let totalReviewsCount = 0;

    if (averageRatingResult.length > 0 && averageRatingResult[0]) {
      averageRating = averageRatingResult[0].averageRating || 0;
      totalReviewsCount = averageRatingResult[0].totalReviews || 0;
    }

    res.json({
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews: totalReviewsCount,
        hasNextPage: page < Math.ceil(totalReviews / limit),
        hasPrevPage: page > 1,
      },
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a review
export const createReview = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = (req as any).user.id;

    // Check if product exists using helper function
    const product = await resolveProductId(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Use the actual product ID for database queries
    const actualProductId = product._id.toString();

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      product: actualProductId,
      user: userId,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: 'You have already reviewed this product' });
    }

    // Create new review
    const review = new Review({
      product: actualProductId,
      user: userId,
      rating,
      comment,
    });

    await review.save();
    await review.populate('user', 'username email');

    // Emit socket event for new review
    try {
      const io = getSocketIO();
      const avgRating = await calculateAverageRating(actualProductId);
      const totalCount = await Review.countDocuments({ product: actualProductId });

      io.emit('review:created', {
        productId: productId.toString(),
        review,
        averageRating: avgRating,
        totalReviews: totalCount,
      });
    } catch (error) {
      // Socket.IO not available
    }

    res.status(201).json({
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a review
export const updateReview = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = (req as any).user.id;

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) {
      return res
        .status(404)
        .json({
          message: 'Review not found or you are not authorized to update it',
        });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();
    await review.populate('user', 'username email');

    // Emit socket event for updated review
    try {
      const io = getSocketIO();
      const productId = review.product.toString();
      const avgRating = await calculateAverageRating(productId);
      const totalCount = await Review.countDocuments({
        product: review.product,
      });

      io.emit('review:updated', {
        productId: productId.toString(),
        review,
        averageRating: avgRating,
        totalReviews: totalCount,
      });
    } catch (error) {
      // Socket.IO not available
    }

    res.json({
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a review (user can delete their own, admin can delete any)
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        message: 'Review not found',
      });
    }

    // Check authorization: user can delete their own review, admin can delete any
    if (userRole !== 'admin' && review.user.toString() !== userId) {
      return res.status(403).json({
        message: 'You are not authorized to delete this review',
      });
    }

    const productId = review.product.toString();
    await Review.findByIdAndDelete(reviewId);

    // Emit socket event for deleted review
    try {
      const io = getSocketIO();
      const avgRating = await calculateAverageRating(productId);
      const totalCount = await Review.countDocuments({ product: productId });

      io.emit('review:deleted', {
        productId: productId.toString(),
        reviewId,
        averageRating: avgRating,
        totalReviews: totalCount,
      });
    } catch (error) {
      // Socket.IO not available
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's review for a specific product
export const getUserReview = async (req: Request, res: Response) => {
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

    const review = await Review.findOne({
      product: actualProductId,
      user: userId,
    }).populate('user', 'username email');

    res.json({ review });
  } catch (error) {
    console.error('Get user review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Validation middleware
export const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
];
