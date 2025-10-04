import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  purchaseItems,
} from '../controllers/cartController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

// Cart routes
router.get('/', getCart);
router.get('/count', getCartCount);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);
router.post('/purchase', purchaseItems);

export default router;
