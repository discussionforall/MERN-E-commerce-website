import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cloudinary, { UPLOAD_PRESETS, VALIDATION_OPTIONS } from '../config/cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

// Middleware for single image upload
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Middleware for multiple images upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => 
  upload.array(fieldName, maxCount);

// Upload image to Cloudinary
export const uploadToCloudinary = async (
  file: any,
  folder: string,
  transformation?: any
): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryV2.uploader.upload_stream(
      {
        folder,
        transformation,
        resource_type: 'auto',
        quality: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id
          });
        } else {
          reject(new Error('Upload failed'));
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

// Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinaryV2.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Validate image dimensions and size
export const validateImage = (
  file: any,
  type: 'product' | 'profile'
): { isValid: boolean; error?: string } => {
  const validation = type === 'product' 
    ? VALIDATION_OPTIONS.PRODUCT_IMAGE 
    : VALIDATION_OPTIONS.USER_PROFILE;

  // Check file size
  if (file.size > validation.maxFileSize) {
    return {
      isValid: false,
      error: `File size too large. Maximum allowed: ${validation.maxFileSize / (1024 * 1024)}MB`
    };
  }

  // Check file type
  const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
  if (!fileExtension || !validation.allowedFormats.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Invalid file format. Allowed formats: ${validation.allowedFormats.join(', ')}`
    };
  }

  return { isValid: true };
};

// Error handling middleware for multer
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

// Helper function to get optimized image URL
export const getOptimizedImageUrl = (
  publicId: string,
  transformation: any
): string => {
  return cloudinaryV2.url(publicId, transformation);
};

// Helper function to get responsive image URLs
export const getResponsiveImageUrls = (publicId: string) => {
  return {
    thumbnail: getOptimizedImageUrl(publicId, { width: 300, height: 300, crop: 'fill' }),
    medium: getOptimizedImageUrl(publicId, { width: 600, height: 400, crop: 'fill' }),
    large: getOptimizedImageUrl(publicId, { width: 1200, height: 800, crop: 'fill' }),
    original: getOptimizedImageUrl(publicId, {})
  };
};
