import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);

export default router;
