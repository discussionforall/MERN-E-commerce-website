import { Product } from '../types';

// Type for simplified product objects (like in orders)
export interface SimplifiedProduct {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
  images?: Array<{
    url: string;
    publicId: string;
    alt: string;
    isPrimary: boolean;
  }>;
}

// Default placeholder images for different categories
const DEFAULT_IMAGES = {
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop&crop=center',
  clothing: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center',
  books: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&crop=center',
  home: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center',
  sports: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
  beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&crop=center',
  other: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center',
  default: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&crop=center'
};

/**
 * Get the best available image URL for a product
 * Prioritizes the primary image from the images array, then falls back to imageUrl (only if it's Cloudinary)
 * If no image is available, returns a category-specific placeholder
 */
export const getProductImageUrl = (product: Product | SimplifiedProduct): string | null => {
  // First, try to get the primary image from the images array
  if (product.images && product.images.length > 0) {
    const primaryImage = product.images.find(img => img.isPrimary);
    if (primaryImage && primaryImage.url) {
      return primaryImage.url;
    }
    // If no primary image found, use the first image
    if (product.images[0] && product.images[0].url) {
      return product.images[0].url;
    }
  }
  
  // Fallback to the legacy imageUrl ONLY if it's a Cloudinary URL
  if (product.imageUrl && product.imageUrl.includes('cloudinary.com')) {
    return product.imageUrl;
  }
  
  // Return category-specific placeholder or default
  return DEFAULT_IMAGES[product.category as keyof typeof DEFAULT_IMAGES] || DEFAULT_IMAGES.default;
};

/**
 * Get all images for a product (for gallery display)
 */
export const getProductImages = (product: Product | SimplifiedProduct) => {
  if (product.images && product.images.length > 0) {
    return product.images;
  }
  
  // If no images array, create one from imageUrl
  if (product.imageUrl) {
    return [{
      url: product.imageUrl,
      publicId: 'cloudinaryPublicId' in product ? product.cloudinaryPublicId || '' : '',
      alt: product.name,
      isPrimary: true
    }];
  }
  
  return [];
};
