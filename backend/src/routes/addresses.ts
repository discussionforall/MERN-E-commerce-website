import { Router } from 'express';
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/addressController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Address management routes
router.get('/', getUserAddresses); // GET /api/addresses - Get all user addresses
router.post('/', createAddress); // POST /api/addresses - Create new address
router.put('/:id', updateAddress); // PUT /api/addresses/:id - Update address
router.delete('/:id', deleteAddress); // DELETE /api/addresses/:id - Delete address
router.patch('/:id/default', setDefaultAddress); // PATCH /api/addresses/:id/default - Set default address

export default router;
