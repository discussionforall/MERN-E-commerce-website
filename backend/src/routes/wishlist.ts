import express from 'express';
import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  toggleWishlist,
} from '../controllers/wishlistController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All wishlist routes require authentication
router.use(authenticate);

// Get user's wishlist
router.get('/', getUserWishlist);

// Add item to wishlist
router.post('/:productId', addToWishlist);

// Remove item from wishlist
router.delete('/:productId', removeFromWishlist);

// Check if product is in wishlist
router.get('/check/:productId', checkWishlistStatus);

// Toggle wishlist status (add/remove)
router.post('/toggle/:productId', toggleWishlist);

export default router;
