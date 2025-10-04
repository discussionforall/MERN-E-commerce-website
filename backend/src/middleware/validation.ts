import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import Category from '../models/Category';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Custom validation to check if category exists in database
export const validateCategoryExists = async (req: Request, res: Response, next: NextFunction) => {
  const { category } = req.body;
  
  if (!category) {
    return next();
  }

  try {
    // Find category with case-insensitive search
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${category}$`, 'i') }
    });
    
    if (!existingCategory) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [{
          type: 'field',
          value: category,
          msg: 'Category does not exist',
          path: 'category',
          location: 'body'
        }]
      });
    }
    
    // Update the category in the request to match the exact case from database
    req.body.category = existingCategory.name;
    next();
  } catch (error) {
    console.error('Category validation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  handleValidationErrors,
];

export const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Product description must be between 10 and 1000 characters'),
  body('price')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category is required and must be between 2 and 50 characters'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  handleValidationErrors,
];
