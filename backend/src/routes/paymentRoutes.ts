import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createPaymentIntent,
  confirmPayment,
  testWebhook,
  getPaymentMethods,
  createCustomer,
} from '../controllers/paymentController';

const router = express.Router();

// Test webhook route (no authentication needed)
router.get('/test-webhook', testWebhook);

// Protected routes
router.post('/create-payment-intent', authenticate, createPaymentIntent);
router.post('/confirm-payment', authenticate, confirmPayment);
router.get('/payment-methods/:userId', authenticate, getPaymentMethods);
router.post('/create-customer', authenticate, createCustomer);

export default router;
