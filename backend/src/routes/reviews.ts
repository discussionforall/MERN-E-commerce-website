import express from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getUserReview,
  validateReview,
} from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.post('/product/:productId', authenticate, validateReview, createReview);
router.get('/product/:productId/user', authenticate, getUserReview);
router.put('/:reviewId', authenticate, validateReview, updateReview);
router.delete('/:reviewId', authenticate, deleteReview);

export default router;
