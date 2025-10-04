import { v2 as cloudinary } from 'cloudinary';
import { IMAGE_TRANSFORMATIONS } from '../config/cloudinary';

// Generate different image sizes for products
export const generateProductImageUrls = (publicId: string) => {
  return {
    thumbnail: cloudinary.url(publicId, IMAGE_TRANSFORMATIONS.PRODUCT_THUMBNAIL),
    gallery: cloudinary.url(publicId, IMAGE_TRANSFORMATIONS.PRODUCT_GALLERY),
    large: cloudinary.url(publicId, IMAGE_TRANSFORMATIONS.PRODUCT_LARGE),
    original: cloudinary.url(publicId, {})
  };
};

// Generate different image sizes for user profiles
export const generateUserImageUrls = (publicId: string) => {
  return {
    avatar: cloudinary.url(publicId, IMAGE_TRANSFORMATIONS.USER_AVATAR),
    large: cloudinary.url(publicId, IMAGE_TRANSFORMATIONS.USER_AVATAR_LARGE),
    original: cloudinary.url(publicId, {})
  };
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (url: string): string | null => {
  try {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Check if URL is a Cloudinary URL
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com');
};

// Generate placeholder image URL
export const getPlaceholderImage = (width: number = 300, height: number = 300): string => {
  return `https://via.placeholder.com/${width}x${height}/f3f4f6/6b7280?text=No+Image`;
};

// Generate default avatar URL
export const getDefaultAvatar = (): string => {
  return 'https://res.cloudinary.com/demo/image/upload/w_150,h_150,c_fill,g_face,r_max/v1/placeholder-avatar.jpg';
};


// Optimize image for web delivery
export const optimizeImageForWeb = (publicId: string, options: {
  width?: number;
  height?: number;
  quality?: string | number;
} = {}) => {
  const defaultOptions = {
    quality: 'auto',
    ...options
  };

  return cloudinary.url(publicId, defaultOptions);
};

// Create image transformation for specific use cases
export const createImageTransformation = (options: {
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  quality?: string | number;
  effect?: string;
  radius?: number;
}) => {
  return {
    width: options.width,
    height: options.height,
    crop: options.crop || 'fill',
    gravity: options.gravity,
    quality: options.quality || 'auto',
    effect: options.effect,
    radius: options.radius
  };
};
