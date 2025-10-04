import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api';
import { ProductRequest } from '../types/index.js';
import { ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';
import { UploadedImage } from '../hooks/useImageUpload';

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [existingImages, setExistingImages] = useState<UploadedImage[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ProductRequest>();

  // Fetch product data for editing
  const { isLoading } = useQuery(
    ['product', id],
    () => productAPI.getProductById(id!),
    {
      enabled: isEdit,
      onSuccess: data => {
        reset(data.product);
        // Set existing images for editing
        if (data.product.images && data.product.images.length > 0) {
          const images = data.product.images.map(img => ({
            url: img.url,
            publicId: img.publicId
          }));
          setExistingImages(images);
          setUploadedImages(images);
        }
      },
    }
  );

  const createMutation = useMutation(productAPI.createProduct, {
    onSuccess: () => {
      toast.success('Product created successfully!');
      queryClient.invalidateQueries(['admin-products']);
      navigate('/admin/products');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });

  const updateMutation = useMutation(
    (data: ProductRequest) => productAPI.updateProduct(id!, data),
    {
      onSuccess: () => {
        toast.success('Product updated successfully!');
        queryClient.invalidateQueries(['admin-products']);
        queryClient.invalidateQueries(['product', id]);
        navigate('/admin/products');
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || 'Failed to update product'
        );
      },
    }
  );

  const onSubmit = async (data: ProductRequest) => {
    try {
      // Prepare the data with uploaded images
      const formData = {
        ...data,
        // Only include imageUrl if it's provided and not empty
        imageUrl: data.imageUrl && data.imageUrl.trim() !== '' ? data.imageUrl : undefined,
        images: uploadedImages.map((img, index) => ({
          url: img.url,
          publicId: img.publicId,
          alt: data.name || '',
          isPrimary: index === 0
        })),
        cloudinaryPublicId: uploadedImages[0]?.publicId
      };

      if (isEdit) {
        await updateMutation.mutateAsync(formData);
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      // Error handling is done in the mutation callbacks
    }
  };

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    // Update form data
    setValue('images', images.map((img, index) => ({
      url: img.url,
      publicId: img.publicId,
      alt: watch('name') || '',
      isPrimary: index === 0
    })));
  };

  // Fetch categories from API - unified system
  const { data: categoriesData, refetch: refetchCategories } = useQuery(
    ['categories'],
    () => categoryAPI.getCategories(),
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  const categories = categoriesData?.categories || [];

  // Create category mutation
  const createCategoryMutation = useMutation(categoryAPI.createCategory, {
    onSuccess: (data) => {
      toast.success('Category created successfully!');
      setNewCategoryName('');
      setShowAddCategory(false);
      refetchCategories();
      // Set the new category as selected
      setValue('category', data.category.name);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create category');
    },
  });

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    await createCategoryMutation.mutateAsync({
      name: newCategoryName.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-64'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center space-x-4'>
        <button
          onClick={() => navigate('/admin/products')}
          className='flex items-center space-x-2 text-gray-600 hover:text-gray-900'
        >
          <ArrowLeft className='h-5 w-5' />
          <span>Back to Products</span>
        </button>
      </div>

      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className='mt-2 text-gray-600'>
          {isEdit
            ? 'Update product information'
            : 'Fill in the details for your new product'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        <div className='bg-white shadow-sm border rounded-lg p-6 space-y-6'>
          {/* Product Name */}
          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700'
            >
              Product Name *
            </label>
            <div className='mt-1'>
              <input
                {...register('name', {
                  required: 'Product name is required',
                  minLength: {
                    value: 2,
                    message: 'Product name must be at least 2 characters',
                  },
                  maxLength: {
                    value: 100,
                    message: 'Product name cannot exceed 100 characters',
                  },
                })}
                type='text'
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                placeholder='Enter product name'
              />
              {errors.name && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor='description'
              className='block text-sm font-medium text-gray-700'
            >
              Description *
            </label>
            <div className='mt-1'>
              <textarea
                {...register('description', {
                  required: 'Description is required',
                  minLength: {
                    value: 10,
                    message: 'Description must be at least 10 characters',
                  },
                  maxLength: {
                    value: 1000,
                    message: 'Description cannot exceed 1000 characters',
                  },
                })}
                rows={4}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                placeholder='Enter product description'
              />
              {errors.description && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Price and Stock */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
            <div>
              <label
                htmlFor='price'
                className='block text-sm font-medium text-gray-700'
              >
                Price *
              </label>
              <div className='mt-1'>
                <input
                  {...register('price', {
                    required: 'Price is required',
                    min: {
                      value: 0,
                      message: 'Price must be a positive number',
                    },
                  })}
                  type='number'
                  step='0.01'
                  min='0'
                  className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                  placeholder='0.00'
                />
                {errors.price && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.price.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor='stock'
                className='block text-sm font-medium text-gray-700'
              >
                Stock Quantity *
              </label>
              <div className='mt-1'>
                <input
                  {...register('stock', {
                    required: 'Stock quantity is required',
                    min: {
                      value: 0,
                      message: 'Stock must be a non-negative number',
                    },
                  })}
                  type='number'
                  min='0'
                  className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                  placeholder='0'
                />
                {errors.stock && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.stock.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor='category'
              className='block text-sm font-medium text-gray-700'
            >
              Category *
            </label>
            <div className='mt-1 space-y-2'>
              <select
                {...register('category', {
                  required: 'Category is required',
                })}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
              >
                <option value=''>Select a category</option>
                {categories.map(category => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              {/* Add New Category Section */}
              {categories.length === 0 && (
                <div className='text-center py-4 text-gray-500'>
                  <p className='text-sm'>No categories available</p>
                </div>
              )}
              
              <div className='flex items-center space-x-2'>
                <button
                  type='button'
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className='flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium'
                >
                  <Plus className='h-4 w-4' />
                  <span>Add New Category</span>
                </button>
              </div>

              {showAddCategory && (
                <div className='border border-gray-200 rounded-md p-4 bg-gray-50'>
                  <div className='flex items-center space-x-2'>
                    <input
                      type='text'
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder='Enter category name'
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                    />
                    <button
                      type='button'
                      onClick={handleAddCategory}
                      disabled={createCategoryMutation.isLoading || !newCategoryName.trim()}
                      className='px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {createCategoryMutation.isLoading ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                      }}
                      className='p-2 text-gray-400 hover:text-gray-600'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              )}

              {errors.category && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.category.message}
                </p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Product Images
            </label>
            <ImageUpload
              onImagesChange={handleImagesChange}
              existingImages={existingImages}
              type="product"
              multiple={true}
              maxFiles={5}
              className="mb-4"
            />
            <p className='mt-1 text-sm text-gray-500'>
              Upload up to 5 images. The first image will be used as the primary image.
            </p>
          </div>

          {/* Legacy Image URL (for backward compatibility) */}
          <div>
            <label
              htmlFor='imageUrl'
              className='block text-sm font-medium text-gray-700'
            >
              Legacy Image URL (Optional)
            </label>
            <div className='mt-1'>
              <input
                {...register('imageUrl', {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL',
                  },
                })}
                type='url'
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                placeholder='https://example.com/image.jpg'
              />
              {errors.imageUrl && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.imageUrl.message}
                </p>
              )}
            </div>
            <p className='mt-1 text-sm text-gray-500'>
              Optional: Add a legacy image URL for backward compatibility
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className='flex justify-end space-x-3'>
          <button
            type='button'
            onClick={() => navigate('/admin/products')}
            className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isSubmitting}
            className='px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {isSubmitting
              ? isEdit
                ? 'Updating...'
                : 'Creating...'
              : isEdit
                ? 'Update Product'
                : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
