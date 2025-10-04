import React, { useState, useRef, useEffect } from 'react';
import { Package } from 'lucide-react';

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  sizes?: string;
  quality?: number;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackIcon,
  loading = 'lazy',
  placeholder = 'blur',
  sizes,
  quality = 80,
  width,
  height,
  onLoad,
  onError,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading !== 'lazy' || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [loading]);

  // Generate optimized Cloudinary URL
  const getOptimizedUrl = (originalUrl: string) => {
    if (!originalUrl) return null;

    // If it's already a Cloudinary URL, add optimization parameters
    if (originalUrl.includes('cloudinary.com')) {
      const url = new URL(originalUrl);
      
      // Add optimization parameters
      const params = new URLSearchParams(url.search);
      params.set('q', quality.toString());
      params.set('f', 'auto'); // Auto format
      params.set('dpr', 'auto'); // Device pixel ratio
      
      if (width) params.set('w', width.toString());
      if (height) params.set('h', height.toString());
      if (sizes) params.set('w', sizes);
      
      // Add responsive parameters
      params.set('c_scale', 'auto');
      params.set('c_crop', 'auto');
      
      url.search = params.toString();
      return url.toString();
    }
    return originalUrl;
  };

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Show placeholder while loading
  if (!src || imageError) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        {fallbackIcon || <Package className="h-8 w-8 text-gray-400" />}
      </div>
    );
  }

  // For lazy loading, show placeholder until in view
  if (loading === 'lazy' && !isInView) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="w-8 h-8 bg-gray-300 rounded"></div>
      </div>
    );
  }

  const optimizedSrc = getOptimizedUrl(src);

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Blur placeholder */}
      {placeholder === 'blur' && !imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
        </div>
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={optimizedSrc || src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={loading}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        style={{ width, height }}
      />
      
      {/* Loading spinner */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
