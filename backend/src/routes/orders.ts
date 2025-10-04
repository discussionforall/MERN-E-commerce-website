import express from 'express';
import {
  createOrder,
  createCheckoutSession,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
  cancelOrder,
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Create checkout session (for buy now flow)
router.post('/checkout-session', authenticate, createCheckoutSession);

// Create a new order
router.post('/', authenticate, createOrder);

// Get user's orders
router.get('/', authenticate, getUserOrders);

// Get single order by ID
router.get('/:id', authenticate, getOrderById);

// Cancel order
router.patch('/:id/cancel', authenticate, cancelOrder);

// Admin routes
// Get all orders
router.get('/admin/all', authenticate, authorize('admin'), getAllOrders);

// Update order status
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  updateOrderStatus
);

export default router;
