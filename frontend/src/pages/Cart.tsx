import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  ArrowLeft,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';
import { calculateOrderTotal } from '../utils/orderCalculations';
import { getProductImageUrl } from '../utils/imageUtils';
import OptimizedImage from '../components/OptimizedImage';
import ConfirmationPopup from '../components/ConfirmationPopup';
import CouponInput from '../components/CouponInput';

const Cart: React.FC = () => {
  const {
    cart,
    loading,
    appliedCoupon,
    discountAmount,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    resetCouponState,
  } = useCart();
  
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Refresh cart data when component mounts
  useEffect(() => {
    refreshCart();
  }, []); // Empty dependency array to run only once on mount

  // Reset coupon state if cart is empty but coupon is still applied
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      if (appliedCoupon) {
        resetCouponState();
      }
    }
  }, [cart, appliedCoupon, resetCouponState]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    updateCartItem(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
  };

  const handleClearCart = () => {
    setShowClearConfirm(true);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleConfirmClear = () => {
    clearCart();
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-64'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className='max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        <div className='text-center py-12'>
          <ShoppingCart className='mx-auto h-16 w-16 text-gray-400' />
          <h3 className='mt-4 text-lg font-medium text-gray-900'>
            Your cart is empty
          </h3>
          <p className='mt-2 text-gray-500'>
            Start shopping to add items to your cart!
          </p>
          <div className='mt-6'>
            <Link
              to='/products'
              className='inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors'
            >
              <ArrowLeft className='h-4 w-4' />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center space-x-3'>
          <ShoppingCart className='h-8 w-8 text-primary-600' />
          <h1 className='text-3xl font-bold text-gray-900'>Shopping Cart</h1>
          <span className='bg-primary-100 text-primary-800 text-sm font-medium px-2.5 py-0.5 rounded-full'>
            {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>
        <button
          onClick={handleClearCart}
          className='flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
        >
          <Trash2 className='h-4 w-4' />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
        {/* Cart Items */}
        <div className='lg:col-span-2'>
          <div className='space-y-4'>
            {cart.items.map(item => (
              <div
                key={item.product._id}
                className='bg-white rounded-lg shadow-sm border p-4 sm:p-6'
              >
                <div className='flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 gap-4'>
                  {/* Product Image */}
                  <div className='flex-shrink-0 mx-auto sm:mx-0'>
                    <OptimizedImage
                      src={getProductImageUrl(item.product)}
                      alt={item.product.name}
                      className='h-24 w-24 sm:h-20 sm:w-20 rounded-md'
                      width={96}
                      height={96}
                      quality={85}
                      loading="lazy"
                      fallbackIcon={<Package className='h-8 w-8 text-gray-400' />}
                    />
                  </div>

                  {/* Product Details */}
                  <div className='flex-1 min-w-0'>
                    <h3 className='text-lg font-medium text-gray-900 truncate'>
                      {item.product.name}
                    </h3>
                    <p className='text-sm text-gray-500 mt-1 line-clamp-2'>
                      {item.product.description}
                    </p>
                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-2'>
                      <span className='text-sm text-gray-500'>
                        Category:{' '}
                        <span className='font-medium capitalize'>
                          {item.product.category}
                        </span>
                      </span>
                      <span className='text-sm text-gray-500'>
                        Stock:{' '}
                        <span className='font-medium'>
                          {item.product.stock}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Price and Quantity Controls */}
                  <div className='flex flex-col sm:items-end space-y-3'>
                    <div className='text-center sm:text-right'>
                      <p className='text-lg font-semibold text-gray-900'>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {formatPrice(item.price)} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className='flex items-center justify-center sm:justify-start space-x-2'>
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.product._id,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                        className='p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <Minus className='h-4 w-4' />
                      </button>
                      <span className='w-12 text-center text-sm font-medium'>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.product._id,
                            item.quantity + 1
                          )
                        }
                        disabled={item.quantity >= item.product.stock}
                        className='p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <Plus className='h-4 w-4' />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.product._id)}
                      className='flex items-center space-x-1 px-2 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
                    >
                      <Trash2 className='h-4 w-4' />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className='lg:col-span-1'>
          <div className='bg-white rounded-lg shadow-sm border p-6 sticky top-4'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Order Summary
            </h2>

            {/* Coupon Input */}
            <div className='mb-4'>
              <CouponInput />
            </div>

            <div className='space-y-3'>
              {(() => {
                const calculations = calculateOrderTotal(cart.totalAmount);
                return (
                  <>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Items ({cart.totalItems})</span>
                      <span className='font-medium'>
                        {formatPrice(calculations.subtotal)}
                      </span>
                    </div>

                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Shipping</span>
                      <span className={`font-medium ${calculations.shipping === 0 ? 'text-green-600' : ''}`}>
                        {calculations.shipping === 0 ? 'Free' : formatPrice(calculations.shipping)}
                      </span>
                    </div>

                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Tax</span>
                      <span className='font-medium'>{formatPrice(calculations.tax)}</span>
                    </div>

                    {/* Subtotal (Full Amount) */}
                    <div className='border-t border-gray-200 pt-3'>
                      <div className='flex justify-between text-base font-semibold'>
                        <span>Subtotal</span>
                        <span>{formatPrice(calculations.total)}</span>
                      </div>
                    </div>

                    {/* Discount Display */}
                    {appliedCoupon && discountAmount > 0 && (
                      <div className='flex justify-between text-sm text-green-600'>
                        <span>Discount ({appliedCoupon.code})</span>
                        <span className='font-medium'>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    {/* Final Total */}
                    <div className='border-t border-gray-200 pt-3'>
                      <div className='flex justify-between text-lg font-bold text-blue-600'>
                        <span>Total</span>
                        <span>{formatPrice(calculations.total - (discountAmount || 0))}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className='mt-6 space-y-3'>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className='w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
              >
                Proceed to Checkout
              </button>

              <Link
                to='/products'
                className='w-full flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium'
              >
                <ArrowLeft className='h-4 w-4' />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Popups */}
      <ConfirmationPopup
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleConfirmClear}
        title='Clear Cart'
        message='Are you sure you want to clear all items from your cart? This action cannot be undone.'
        confirmText='Clear Cart'
        cancelText='Keep Items'
        type='warning'
      />
    </div>
  );
};

export default Cart;
