import { useState, useCallback } from 'react';
import api from '../services/api';

export interface UploadedImage {
  url: string;
  publicId: string;
}

export interface ImageUploadOptions {
  type: 'product' | 'profile';
  multiple?: boolean;
  maxFiles?: number;
}

export const useImageUpload = (options: ImageUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImages = useCallback(async (files: File[]): Promise<UploadedImage[]> => {
    if (!files || files.length === 0) {
      throw new Error('No files selected');
    }

    // Validate file count
    if (options.multiple && files.length > (options.maxFiles || 5)) {
      throw new Error(`Maximum ${options.maxFiles || 5} files allowed`);
    }

    if (!options.multiple && files.length > 1) {
      throw new Error('Only one file allowed');
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      if (options.multiple) {
        files.forEach((file) => {
          formData.append('images', file);
        });
      } else {
        formData.append('image', files[0]);
      }

      const endpoint = options.type === 'product' 
        ? (options.multiple ? '/upload/products' : '/upload/product')
        : '/upload/profile';

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      if (response.data.success) {
        setUploadProgress(100);
        
        // For single image uploads (profile), wrap in array
        if (!options.multiple) {
          return [response.data.data];
        }
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [options]);

  const deleteImage = useCallback(async (publicId: string): Promise<void> => {
    try {
      await api.delete(`/upload/${publicId}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Delete failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setUploadProgress(0);
    setUploading(false);
  }, []);

  return {
    uploadImages,
    deleteImage,
    uploading,
    uploadProgress,
    error,
    reset,
  };
};
