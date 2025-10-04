import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  Package,
  ArrowLeft,
  Edit,
  Hash,
  Star,
  ShoppingCart,
  Zap,
  Heart,
  UserIcon,
  Calendar,
  MessageSquare,
  Send,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { productAPI, reviewAPI, wishlistAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { getProductImageUrl } from '../utils/imageUtils';
import RelatedProducts from '../components/RelatedProducts';
import ImageGallery from '../components/ImageGallery';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Product data
  const { data, isLoading, error } = useQuery(
    ['product', id],
    () => productAPI.getProductById(id!),
    { enabled: !!id }
  );

  // State for product interactions
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);

  // Wishlist state
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Related products state
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // Load reviews
  const loadReviews = async () => {
    if (!id) return;
    try {
      setIsLoadingReviews(true);
      const response = await reviewAPI.getProductReviews(id, 1, 4);
      setReviews(response.reviews || []);
      
      // Calculate average manually from reviews
      if (response.reviews && response.reviews.length > 0) {
        const manualAverage = response.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / response.reviews.length;
        setAverageRating(manualAverage);
        setTotalReviews(response.reviews.length);
      } else {
        setAverageRating(0);
        setTotalReviews(0);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Load wishlist status
  const loadWishlistStatus = async () => {
    if (!user || !id) return;
    try {
      setIsWishlistLoading(true);
      const response = await wishlistAPI.checkWishlistStatus(id);
      setIsInWishlist(response.isInWishlist);
    } catch (error) {
      console.error('Error loading wishlist status:', error);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // Load user's review
  const loadUserReview = async () => {
    if (!user || !id) return;
    try {
      const response = await reviewAPI.getUserReview(id);
      setUserReview(response.review);
    } catch (error) {
      console.error('Error loading user review:', error);
    }
  };

  // Load related products
  const loadRelatedProducts = async () => {
    if (!data?.product?.category || !id) return;
    
    try {
      setIsLoadingRelated(true);
      const response = await productAPI.getProducts({
        page: 1,
        limit: 4,
        category: data.product.category,
        search: ''
      });
      // Filter out the current product and take only 3
      const filtered = response.products.filter(p => p._id !== id).slice(0, 3);
      setRelatedProducts(filtered);
    } catch (error) {
      console.error('Error loading related products:', error);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (id) {
      loadReviews();
      loadWishlistStatus();
      loadUserReview();
    }
  }, [id, user]);

  // Load related products when product data is available
  useEffect(() => {
    if (data?.product?.category) {
      loadRelatedProducts();
    }
  }, [data?.product?.category, id]);

  // Reset related products when product changes
  useEffect(() => {
    setRelatedProducts([]);
    setIsLoadingRelated(false);
  }, [id]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleReviewCreated = (data: any) => {
      if (data.productId === id) {
        loadReviews();
        loadUserReview();
      }
    };

    const handleReviewUpdated = (data: any) => {
      if (data.productId === id) {
        loadReviews();
        loadUserReview();
      }
    };

    const handleReviewDeleted = (data: any) => {
      if (data.productId === id) {
        loadReviews();
        loadUserReview();
      }
    };

    const handleProductUpdated = (product: any) => {
      if (product._id === id) {
        // Refetch the product data
        queryClient.invalidateQueries(['product', id]);
        toast.success('Product updated!');
      }
    };

    const handleProductDeleted = (productId: string) => {
      if (productId === id) {
        toast.error('This product has been deleted');
        navigate('/products');
      }
    };

    socket.on('review:created', handleReviewCreated);
    socket.on('review:updated', handleReviewUpdated);
    socket.on('review:deleted', handleReviewDeleted);
    socket.on('product:updated', handleProductUpdated);
    socket.on('product:deleted', handleProductDeleted);

    return () => {
      socket.off('review:created', handleReviewCreated);
      socket.off('review:updated', handleReviewUpdated);
      socket.off('review:deleted', handleReviewDeleted);
      socket.off('product:updated', handleProductUpdated);
      socket.off('product:deleted', handleProductDeleted);
    };
  }, [socket, id, navigate]);

  // Wishlist handlers
  const handleWishlistToggle = async () => {
    if (!user || !id) {
      toast.error('Please login to manage your wishlist');
      return;
    }

    try {
      setIsWishlistLoading(true);
      const response = await wishlistAPI.toggleWishlist(id);
      setIsInWishlist(response.isInWishlist);
      toast.success(response.isInWishlist ? 'Added to wishlist!' : 'Removed from wishlist!');
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // Review handlers
  const handleReviewSubmit = async () => {
    if (!user || !id) return;

    try {
      setIsSubmittingReview(true);
      if (userReview) {
        await reviewAPI.updateReview(userReview._id, reviewRating, reviewText);
        toast.success('Review updated successfully!');
      } else {
        await reviewAPI.createReview(id, reviewRating, reviewText);
        toast.success('Review submitted successfully!');
      }
      setShowReviewForm(false);
      setReviewText('');
      setReviewRating(0);
      loadReviews();
      loadUserReview();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditReview = () => {
    if (userReview) {
      setReviewText(userReview.comment);
      setReviewRating(userReview.rating);
      setShowReviewForm(true);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    try {
      await reviewAPI.deleteReview(userReview._id);
      toast.success('Review deleted successfully!');
      setShowReviewForm(false);
      setReviewText('');
      setReviewRating(0);
      loadReviews();
      loadUserReview();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(error.response?.data?.message || 'Failed to delete review');
    }
  };

  // Admin function to delete any review
  const handleAdminDeleteReview = async (reviewId: string) => {
    if (!user || user.role !== 'admin') return;

    try {
      await reviewAPI.deleteReview(reviewId);
      toast.success('Review deleted successfully!');
      loadReviews();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(error.response?.data?.message || 'Failed to delete review');
    }
  };

  // Cart handlers
  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      setIsAddingToCart(true);
      await addToCart(data!.product._id, quantity);
      toast.success('Product added to cart!');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please login to make a purchase');
      return;
    }

    try {
      const product = data!.product;
      const buyNowData = {
        items: [{
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            imageUrl: getProductImageUrl(product),
            category: product.category
          },
          quantity: quantity,
          price: product.price
        }],
        total: product.price * quantity,
        userId: user._id,
        type: 'buy_now',
        originalCart: null
      };
      
      navigate('/checkout', { 
        state: { 
          checkoutData: buyNowData,
          buyNow: true,
          productName: product.name
        }
      });
    } catch (error: any) {
      console.error('Error preparing buy now:', error);
      toast.error('Failed to prepare buy now checkout');
    }
  };

  // Utility functions
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      electronics: 'bg-blue-100 text-blue-800',
      clothing: 'bg-purple-100 text-purple-800',
      books: 'bg-green-100 text-green-800',
      home: 'bg-orange-100 text-orange-800',
      sports: 'bg-red-100 text-red-800',
      beauty: 'bg-pink-100 text-pink-800',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  if (error || !data?.product) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <Package className='mx-auto h-12 w-12 text-gray-400' />
          <h1 className='text-2xl font-bold text-gray-900 mt-4'>
            Product Not Found
          </h1>
          <p className='text-gray-600 mt-2'>
            The product you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate('/products')}
            className='mt-4 px-6 py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors font-medium'
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const product = data.product;

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() =>
                  navigate(user?.role === 'admin' ? '/admin/products' : '/products')
                }
                className='flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer'
              >
                <ArrowLeft className='h-5 w-5' />
                <span>Back to Products</span>
              </button>
            </div>

            {user?.role === 'admin' && (
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() =>
                    navigate(`/admin/products/${product._id}/edit`)
                  }
                  className='flex items-center space-x-1 px-4 py-2 text-sm text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors font-medium cursor-pointer'
                >
                  <Edit className='h-4 w-4' />
                  <span>Edit Product</span>
                </button>
                <button
                  onClick={() => navigate('/admin/products')}
                  className='flex items-center space-x-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer'
                >
                  <Package className='h-4 w-4' />
                  <span>Manage Products</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* Product Information Grid */}
        <div className='bg-white rounded-lg shadow-sm overflow-hidden mb-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8'>
            {/* Product Image */}
            <div className='space-y-4'>
              <div className='relative group'>
                {/* Use ImageGallery if we have multiple images, otherwise fallback to single image */}
                {product.images && product.images.length > 0 ? (
                  <ImageGallery
                    images={product.images}
                    className="w-full h-64 sm:h-80 lg:h-96"
                    showThumbnails={true}
                  />
                ) : (() => {
                  const imageUrl = getProductImageUrl(product);
                  return imageUrl && !imageError ? (
                    <div className="relative">
                      {imageLoading && (
                        <div className='absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center'>
                          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
                        </div>
                      )}
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className='w-full h-64 sm:h-80 lg:h-96 object-cover rounded-lg'
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          setImageError(true);
                          setImageLoading(false);
                        }}
                      />
                    </div>
                  ) : (
                    <div className='w-full h-64 sm:h-80 lg:h-96 bg-gray-200 rounded-lg flex items-center justify-center'>
                      <Package className='h-24 w-24 text-gray-400' />
                    </div>
                  );
                })()}
                
                {/* Wishlist Button - Top Right Corner */}
                {user?.role !== 'admin' && (
                  <button
                    onClick={handleWishlistToggle}
                    disabled={isWishlistLoading}
                    className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all duration-200 ${
                      isInWishlist
                        ? 'bg-white/90 text-red-500 hover:bg-white'
                        : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                    } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                    title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart 
                      className={`h-5 w-5 ${
                        isInWishlist ? 'fill-current text-red-500' : ''
                      }`} 
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className='space-y-4 sm:space-y-6'>
              <div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0'>
                  <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
                    {product.name}
                  </h1>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full w-fit ${getCategoryColor(product.category)}`}
                  >
                    {product.category.charAt(0).toUpperCase() +
                      product.category.slice(1)}
                  </span>
                </div>
                <p className='text-gray-600 text-base sm:text-lg leading-relaxed'>
                  {product.description}
                </p>
              </div>

              {/* Price and Stock */}
              <div className='flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6'>
                <div className='flex items-center space-x-2 text-2xl sm:text-3xl font-bold text-primary-600'>
                  <span>{formatPrice(product.price)}</span>
                </div>
                <div className='flex items-center space-x-2 text-base sm:text-lg text-gray-600'>
                  <Hash className='h-5 w-5' />
                  <span>Stock: {product.stock}</span>
                </div>
              </div>

              {/* Rating Section */}
              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-1'>
                  {isLoadingReviews ? (
                    <div className='flex space-x-1'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className='h-5 w-5 bg-gray-200 rounded animate-pulse'></div>
                      ))}
                    </div>
                  ) : (
                    [1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= averageRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))
                  )}
                </div>
                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  {isLoadingReviews ? (
                    <div className='h-4 w-8 bg-gray-200 rounded animate-pulse'></div>
                  ) : (
                    <span className='font-medium'>
                      {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                    </span>
                  )}
                  <span>({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
                </div>
              </div>

              {/* Stock Status */}
              <div className='mt-6'>
                {product.stock > 0 ? (
                  <div className='flex items-center space-x-2 text-green-600'>
                    <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                    <span className='font-medium'>
                      In Stock ({product.stock} available)
                    </span>
                  </div>
                ) : (
                  <div className='flex items-center space-x-2 text-red-600'>
                    <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                    <span className='font-medium'>Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {user?.role !== 'admin' && product.stock > 0 && (
                <div className='mt-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Quantity
                  </label>
                  <div className='flex items-center space-x-3'>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className='w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      -
                    </button>
                    <span className='w-12 text-center font-medium'>{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className='w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      +
                    </button>
                    <span className='text-sm text-gray-500'>
                      Max: {product.stock}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons - Only show for non-admin users */}
              {user?.role !== 'admin' && (
                <div className='pt-6 border-t border-gray-200'>
                  <div className='space-y-4'>
                    {/* Main Action Buttons */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      <button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || product.stock === 0}
                        className='flex items-center justify-center space-x-2 px-6 py-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]'
                      >
                        <ShoppingCart className='h-5 w-5' />
                        <span>
                          {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                        </span>
                      </button>

                      <button
                        onClick={handleBuyNow}
                        disabled={product.stock === 0}
                        className='flex items-center justify-center space-x-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]'
                      >
                        <Zap className='h-5 w-5' />
                        <span>Buy Now</span>
                      </button>
                    </div>
                    
                    {/* Help Text */}
                    <div className='text-center'>
                      <p className='text-xs text-gray-500'>
                        <span className='font-medium text-orange-600'>Buy Now:</span> Skip cart and checkout immediately
                      </p>
                    </div>
                  </div>

                  {!user && (
                    <div className='mt-4 text-center'>
                      <p className='text-sm text-gray-500'>
                        Please login to add items to cart or make a purchase
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-Width Reviews Section */}
        <div className='bg-white rounded-lg shadow-sm overflow-hidden mb-8'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <h2 className='text-2xl font-bold text-gray-900 flex items-center space-x-3'>
                <MessageSquare className='h-6 w-6 text-blue-600' />
                <span>Customer Reviews & Feedback</span>
              </h2>
              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-2'>
                  <div className='flex items-center space-x-1'>
                    {isLoadingReviews ? (
                      <div className='flex space-x-1'>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div key={star} className='h-5 w-5 bg-gray-200 rounded animate-pulse'></div>
                        ))}
                      </div>
                    ) : (
                      [1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= averageRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))
                    )}
                  </div>
                  <span className='text-lg font-semibold text-gray-900'>
                    {isLoadingReviews ? '...' : averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span className='text-gray-500'>
                    ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                  </span>
                </div>
                {user && !userReview && user?.role !== 'admin' && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className='px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors'
                  >
                    Write a Review
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className='p-6'>
            {/* Review Form - Only for non-admin users */}
            {showReviewForm && user?.role !== 'admin' && (
              <div className='mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  {userReview ? 'Edit Your Review' : 'Write a Review'}
                </h3>
                
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Star Rating */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-3'>
                      Rating *
                    </label>
                    <div className='flex space-x-2'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type='button'
                          onClick={() => setReviewRating(star)}
                          className={`p-2 rounded-lg transition-colors ${
                            star <= reviewRating
                              ? 'text-yellow-400 bg-yellow-50'
                              : 'text-gray-300 hover:text-yellow-300 hover:bg-gray-50'
                          }`}
                        >
                          <Star className='h-8 w-8 fill-current' />
                        </button>
                      ))}
                    </div>
                    <p className='text-xs text-gray-500 mt-1'>
                      {reviewRating === 0 && 'Please select a rating'}
                      {reviewRating === 1 && 'Poor'}
                      {reviewRating === 2 && 'Fair'}
                      {reviewRating === 3 && 'Good'}
                      {reviewRating === 4 && 'Very Good'}
                      {reviewRating === 5 && 'Excellent'}
                    </p>
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-3'>
                      Your Review *
                    </label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder='Share your experience with this product...'
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
                      rows={4}
                      maxLength={1000}
                    />
                    <div className='flex justify-between items-center mt-2'>
                      <div className='text-xs text-gray-500'>
                        {reviewText.length}/1000 characters
                      </div>
                      <div className='text-xs text-gray-400'>
                        Minimum 10 characters
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className='flex justify-end space-x-3 mt-6'>
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewText('');
                      setReviewRating(0);
                    }}
                    className='px-6 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReviewSubmit}
                    disabled={isSubmittingReview || reviewRating === 0 || reviewText.trim().length < 10}
                    className='px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors'
                  >
                    <Send className='h-4 w-4' />
                    <span>
                      {isSubmittingReview 
                        ? 'Submitting...' 
                        : userReview 
                          ? 'Update Review' 
                          : 'Submit Review'
                      }
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* User's Review */}
            {userReview && (
              <div className='mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center space-x-3'>
                    <UserIcon className='h-5 w-5 text-blue-600' />
                    <span className='text-lg font-semibold text-blue-900'>Your Review</span>
                  </div>
                  <div className='flex space-x-3'>
                    <button
                      onClick={handleEditReview}
                      className='text-sm text-blue-600 hover:text-blue-800 font-medium'
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteReview}
                      className='text-sm text-red-600 hover:text-red-800 font-medium'
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className='flex items-center space-x-2 mb-3'>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= userReview.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className='text-sm font-medium text-gray-700'>
                    {userReview.rating} out of 5 stars
                  </span>
                </div>
                <p className='text-gray-700 mb-3'>{userReview.comment}</p>
                <div className='text-sm text-gray-500 flex items-center space-x-2'>
                  <Calendar className='h-4 w-4' />
                  <span>Reviewed on {new Date(userReview.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}

            {/* Recent Reviews */}
            {reviews.length > 0 ? (
              <div className='space-y-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Recent Reviews ({reviews.length})
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {reviews.map((review) => (
                    <div key={review._id} className='p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center space-x-3'>
                          <UserIcon className='h-5 w-5 text-gray-500' />
                          <span className='font-medium text-gray-900'>
                            {review.user.username}
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <div className='flex items-center space-x-1'>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          {/* Admin Delete Button */}
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleAdminDeleteReview(review._id)}
                              className='ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors'
                              title='Delete Review'
                            >
                              <Trash2 className='h-4 w-4' />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className='text-gray-700 mb-3'>{review.comment}</p>
                      <div className='text-sm text-gray-500 flex items-center space-x-2'>
                        <Calendar className='h-4 w-4' />
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {totalReviews > reviews.length && (
                  <div className='text-center pt-4'>
                    <button
                      onClick={() => {
                        toast.success('View all reviews feature coming soon!');
                      }}
                      className='px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors'
                    >
                      View all {totalReviews} reviews
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className='text-center py-12 text-gray-500'>
                <MessageSquare className='h-16 w-16 mx-auto mb-4 text-gray-300' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>No reviews yet</h3>
                <p className='text-sm'>Be the first to review this product!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Related Products Section */}
      <RelatedProducts 
        products={relatedProducts}
        isLoading={isLoadingRelated}
        category={data?.product?.category || ''}
        userRole={user?.role}
      />
    </div>
  );
};

export default ProductDetails;
