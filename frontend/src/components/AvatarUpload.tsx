import React, { useCallback, useState, useRef, useEffect } from 'react';
import { X, User, AlertCircle } from 'lucide-react';
import { useImageUpload, UploadedImage } from '../hooks/useImageUpload';

interface AvatarUploadProps {
  onImageChange: (image: UploadedImage | null) => void;
  existingImage?: UploadedImage;
  className?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  onImageChange,
  existingImage,
  className = '',
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(existingImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadImages, deleteImage, uploading, uploadProgress, error, reset } = useImageUpload({
    type: 'profile',
    multiple: false,
    maxFiles: 1,
  });

  // Update previewImage when existingImage changes
  useEffect(() => {
    setPreviewImage(existingImage || null);
  }, [existingImage]);

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
    const maxSize = 2 * 1024 * 1024; // 2MB for profiles
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      alert(`File size too large. Maximum allowed: 2MB`);
      return;
    }

    try {
      reset();
      const uploadedImages = await uploadImages(fileArray);
      if (uploadedImages.length > 0) {
        setPreviewImage(uploadedImages[0]);
        onImageChange(uploadedImages[0]);
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
  }, [uploadImages, onImageChange, reset]);

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

  const handleRemoveImage = useCallback(async () => {
    try {
      if (previewImage?.publicId) {
        await deleteImage(previewImage.publicId);
      }
      
      setPreviewImage(null);
      onImageChange(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  }, [previewImage, deleteImage, onImageChange]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-full w-32 h-32 mx-auto transition-colors ${
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
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex items-center justify-center w-full h-full">
          {previewImage ? (
            <div className="relative w-full h-full">
              <img
                src={previewImage.url}
                alt="Profile avatar"
                className="w-full h-full object-cover rounded-full"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              ) : (
                <User className="h-8 w-8 text-gray-400 mx-auto" />
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

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

      {/* Upload Button */}
      {!previewImage && !uploading && (
        <div className="text-center">
          <button
            type="button"
            onClick={openFileDialog}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Choose Avatar
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Drag & drop or click to select
          </p>
          <p className="text-xs text-gray-400">
            Max size: 2MB
          </p>
        </div>
      )}

      {/* Change Avatar Button */}
      {previewImage && !uploading && (
        <div className="text-center">
          <button
            type="button"
            onClick={openFileDialog}
            className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            Change Avatar
          </button>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
