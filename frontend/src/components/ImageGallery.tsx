import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: {
    url: string;
    publicId: string;
    alt: string;
    isPrimary: boolean;
  }[];
  className?: string;
  showThumbnails?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = '',
  showThumbnails = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📷</span>
          </div>
          <p className="text-sm">No images available</p>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentImage = images[currentIndex];

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Main Image Display */}
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
          <img
            src={currentImage.url}
            alt={currentImage.alt || `Product image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
          
          {/* Primary Badge */}
          {currentImage.isPrimary && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
              Primary
            </div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {showThumbnails && images.length > 1 && (
          <div className="mt-4 flex space-x-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentIndex
                    ? 'border-blue-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.alt || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

    </>
  );
};

export default ImageGallery;
