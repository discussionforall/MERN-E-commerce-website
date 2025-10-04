import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useImageUpload, UploadedImage } from '../hooks/useImageUpload';

interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void;
  existingImages?: UploadedImage[];
  type: 'product' | 'profile';
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  existingImages = [],
  type,
  multiple = false,
  maxFiles = 5,
  className = '',
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState<UploadedImage[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadImages, deleteImage, uploading, uploadProgress, error, reset } = useImageUpload({
    type,
    multiple,
    maxFiles,
  });

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = fileArray.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      alert('Please select only image files (JPEG, PNG, WebP)');
      return;
    }

    // Validate file sizes
    const maxSize = type === 'product' ? 5 * 1024 * 1024 : 2 * 1024 * 1024; // 5MB for products, 2MB for profiles
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      alert(`File size too large. Maximum allowed: ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    try {
      reset();
      const uploadedImages = await uploadImages(fileArray);
      const newImages = [...previewImages, ...uploadedImages];
      setPreviewImages(newImages);
      onImagesChange(newImages);
    } catch (err) {
      console.error('Upload error:', err);
    }
  }, [previewImages, uploadImages, onImagesChange, type, reset]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleRemoveImage = useCallback(async (index: number, publicId?: string) => {
    try {
      if (publicId) {
        await deleteImage(publicId);
      }
      
      const newImages = previewImages.filter((_, i) => i !== index);
      setPreviewImages(newImages);
      onImagesChange(newImages);
    } catch (err) {
      console.error('Delete error:', err);
    }
  }, [previewImages, deleteImage, onImagesChange]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const canAddMore = multiple ? previewImages.length < maxFiles : previewImages.length === 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
              {uploading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              ) : (
                <Upload className="w-full h-full" />
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {uploading ? 'Uploading...' : 'Upload Images'}
              </p>
              <p className="text-sm text-gray-500">
                {multiple 
                  ? `Drag and drop up to ${maxFiles} images, or click to select`
                  : 'Drag and drop an image, or click to select'
                }
              </p>
              <p className="text-xs text-gray-400">
                Supports: JPEG, PNG, WebP • Max size: {type === 'product' ? '5MB' : '2MB'}
              </p>
            </div>

            {!uploading && (
              <button
                type="button"
                onClick={openFileDialog}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Choose Files
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={reset}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Image Preview Grid */}
      {previewImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Uploaded Images ({previewImages.length}{multiple ? `/${maxFiles}` : ''})
          </h4>
          
          <div className={`grid gap-4 ${
            multiple 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' 
              : 'grid-cols-1 max-w-xs'
          }`}>
            {previewImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index, image.publicId)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Primary Image Badge */}
                {multiple && index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add More Button for Multiple Images */}
          {multiple && previewImages.length < maxFiles && (
            <button
              type="button"
              onClick={openFileDialog}
              disabled={uploading}
              className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50"
            >
              <div className="text-center">
                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Add More Images</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
