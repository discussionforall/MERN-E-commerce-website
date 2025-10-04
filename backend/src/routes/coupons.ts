import express from 'express';
import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon
} from '../controllers/couponController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/validate', validateCoupon);
router.post('/apply', applyCoupon);

// Admin routes
router.get('/', authenticate, authorize('admin'), getAllCoupons);
router.get('/:id', authenticate, authorize('admin'), getCouponById);
router.post('/', authenticate, authorize('admin'), createCoupon);
router.put('/:id', authenticate, authorize('admin'), updateCoupon);
router.delete('/:id', authenticate, authorize('admin'), deleteCoupon);

export default router;
