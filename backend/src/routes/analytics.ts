import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getAnalytics } from '../controllers/analyticsController';

const router = express.Router();

// Get analytics data (Admin only)
router.get('/', authenticate, authorize('admin'), getAnalytics);

export default router;
