import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default cloudinary;

// Upload presets for different image types
export const UPLOAD_PRESETS = {
  PRODUCT_IMAGES: 'ecommerce_products',
  USER_PROFILES: 'ecommerce_profiles',
  ADMIN_UPLOADS: 'admin_uploads'
};

// Image transformation options
export const IMAGE_TRANSFORMATIONS = {
  PRODUCT_THUMBNAIL: {
    width: 300,
    height: 300,
    crop: 'fill',
    quality: 'auto'
  },
  PRODUCT_GALLERY: {
    width: 800,
    height: 600,
    crop: 'fill',
    quality: 'auto'
  },
  PRODUCT_LARGE: {
    width: 1200,
    height: 800,
    crop: 'fill',
    quality: 'auto'
  },
  USER_AVATAR: {
    width: 150,
    height: 150,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto'
  },
  USER_AVATAR_LARGE: {
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto'
  }
};

// Validation options
export const VALIDATION_OPTIONS = {
  PRODUCT_IMAGE: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxDimensions: { width: 4000, height: 4000 }
  },
  USER_PROFILE: {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxDimensions: { width: 2000, height: 2000 }
  }
};
