import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
} from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/auth';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Validation middleware
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  handleValidationErrors,
];

const validateCategoryUpdate = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  handleValidationErrors,
];

// Public routes (both user and admin can read)
router.get('/', getCategories);

// Admin routes (only admin can create/update)
router.post('/', authenticate, authorize('admin'), validateCategory, createCategory);
router.put('/:id', authenticate, authorize('admin'), validateCategoryUpdate, updateCategory);

export default router;
