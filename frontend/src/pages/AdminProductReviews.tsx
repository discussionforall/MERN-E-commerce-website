import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productAPI, reviewAPI } from '../services/api';
import { ArrowLeft, MessageSquare, Star, Trash2, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProductImageUrl } from '../utils/imageUtils';

const AdminProductReviews: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch product details
  const { data: productData, isLoading: isLoadingProduct } = useQuery(
    ['product', id],
    () => productAPI.getProductById(id!),
    {
      enabled: !!id,
    }
  );

  // Fetch reviews
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery(
    ['product-reviews', id, currentPage],
    () => reviewAPI.getProductReviews(id!, currentPage, 10),
    {
      enabled: !!id,
    }
  );

  // Delete review mutation
  const deleteReviewMutation = useMutation(reviewAPI.deleteReview, {
    onSuccess: () => {
      toast.success('Review deleted successfully!');
      queryClient.invalidateQueries(['product-reviews']);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete review');
    },
  });

  const handleDeleteReview = (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoadingProduct || isLoadingReviews) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!productData?.product) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Product not found</h3>
        <p className="mt-1 text-sm text-gray-500">The product you're looking for doesn't exist.</p>
      </div>
    );
  }

  const product = productData.product;
  const reviews = reviewsData?.reviews || [];
  const totalReviews = reviewsData?.totalReviews || 0;
  const averageRating = reviewsData?.averageRating || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Products</span>
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <img
            src={getProductImageUrl(product) || '/placeholder-product.jpg'}
            alt={product.name}
            className="h-16 w-16 rounded-lg object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">{product.category}</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                {renderStars(Math.round(averageRating))}
                <span className="ml-2 text-sm text-gray-600">
                  {averageRating.toFixed(1)} ({totalReviews} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Product Reviews ({totalReviews})</span>
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {reviews.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
              <p className="mt-1 text-sm text-gray-500">This product doesn't have any reviews yet.</p>
            </div>
          ) : (
            reviews.map((review: any) => (
              <div key={review._id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {review.user?.username || 'Anonymous'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    className="ml-4 p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {reviewsData?.pagination && reviewsData.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalReviews)} of {totalReviews} reviews
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!reviewsData.pagination.hasPrev}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!reviewsData.pagination.hasNext}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductReviews;
