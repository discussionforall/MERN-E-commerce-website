import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getCategories,
  getSearchSuggestions,
  exportProductsToCSV,
  importProductsFromCSV,
  getCSVTemplate,
  upload,
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';
import { validateProduct, validateCategoryExists } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/search-suggestions', getSearchSuggestions);
router.get('/:id', getProductById);

// Protected routes
router.use(authenticate);

// User routes
router.get('/my/products', getMyProducts);

// Admin routes
router.post('/', authorize('admin'), validateProduct, validateCategoryExists, createProduct);
router.put('/:id', authorize('admin'), validateProduct, validateCategoryExists, updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

// CSV Import/Export routes (Admin only)
router.get('/export/csv', authorize('admin'), exportProductsToCSV);
router.get('/template/csv', authorize('admin'), getCSVTemplate);
router.post('/import/csv', authorize('admin'), upload.single('csvFile'), importProductsFromCSV);

export default router;
