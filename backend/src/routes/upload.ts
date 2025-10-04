import express from 'express';
import { 
  uploadSingle, 
  uploadMultiple, 
  uploadToCloudinary, 
  deleteFromCloudinary,
  handleUploadError,
  validateImage
} from '../middleware/cloudinary';
import { authenticate, authorize } from '../middleware/auth';
import { UPLOAD_PRESETS } from '../config/cloudinary';

const router = express.Router();

// Upload single product image
router.post('/product', 
  authenticate, 
  authorize('admin'), 
  uploadSingle('image'),
  handleUploadError,
  async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Validate image
      const validation = validateImage(req.file, 'product');
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Upload to Cloudinary with organized folder structure
      const result = await uploadToCloudinary(
        req.file, 
        'ecommerce/products',
        { quality: 'auto' }
      );

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.url,
          publicId: result.public_id
        }
      });
    } catch (error) {
      console.error('Product image upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image'
      });
    }
  }
);

// Upload multiple product images
router.post('/products', 
  authenticate, 
  authorize('admin'), 
  uploadMultiple('images', 5),
  handleUploadError,
  async (req: any, res: any) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided'
        });
      }

      const uploadPromises = req.files.map(async (file: any) => {
        // Validate each image
        const validation = validateImage(file, 'product');
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        // Upload to Cloudinary with organized folder structure
        return await uploadToCloudinary(
          file, 
          'ecommerce/products',
          { quality: 'auto' }
        );
      });

      const results = await Promise.all(uploadPromises);

      res.json({
        success: true,
        message: 'Images uploaded successfully',
        data: results.map(result => ({
          url: result.url,
          publicId: result.public_id
        }))
      });
    } catch (error) {
      console.error('Multiple product images upload error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload images'
      });
    }
  }
);

// Upload user profile image
router.post('/profile', 
  authenticate, 
  uploadSingle('image'),
  handleUploadError,
  async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Validate image
      const validation = validateImage(req.file, 'profile');
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      // Upload to Cloudinary with organized folder structure
      const result = await uploadToCloudinary(
        req.file, 
        'ecommerce/profiles',
        { 
          quality: 'auto',
          transformation: {
            width: 300,
            height: 300,
            crop: 'fill',
            gravity: 'face'
          }
        }
      );

      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          url: result.url,
          publicId: result.public_id
        }
      });
    } catch (error) {
      console.error('Profile image upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload profile image'
      });
    }
  }
);

// Delete image from Cloudinary
router.delete('/:publicId', 
  authenticate, 
  authorize('admin'),
  async (req: any, res: any) => {
    try {
      const { publicId } = req.params;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'Public ID is required'
        });
      }

      await deleteFromCloudinary(publicId);

      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      console.error('Image deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete image'
      });
    }
  }
);

export default router;
