import React, { useState, useEffect, useRef } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductImageUrl } from '../utils/imageUtils';
import { stripePromise } from '../config/stripe';
import StripePayment from '../components/StripePayment';
import { ArrowLeft, ShoppingCart, Loader2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';
import { calculateOrderTotal } from '../utils/orderCalculations';
import { toast } from 'react-hot-toast';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, appliedCoupon, discountAmount } = useCart();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const paymentIntentCreated = useRef(false);
  
  // Check if this is a "Buy Now" flow
  const isBuyNow = location.state?.buyNow || false;
  const productName = location.state?.productName || '';

  // Load checkout data from navigation state or localStorage (fallback)
  useEffect(() => {
    const locationState = location.state as any;
    if (locationState?.checkoutData) {
      // Use data from navigation state (buy now flow)
      setCheckoutData(locationState.checkoutData);
    } else if (!isBuyNow) {
      // Only use localStorage for regular cart flow, not buy now
      const savedCheckoutData = localStorage.getItem('checkoutData');
      if (savedCheckoutData) {
        setCheckoutData(JSON.parse(savedCheckoutData));
      }
    }
    
    // Redirect to products if no data available for buy now
    if (isBuyNow && !locationState?.checkoutData) {
      toast.error('No product selected for buy now');
      navigate('/products');
      return;
    }
  }, [navigate, isBuyNow, location.state]);

  const handlePaymentSuccess = () => {
    const message = isBuyNow 
      ? `Payment successful! Your ${productName} has been ordered.`
      : 'Payment successful! Your order has been processed.';
      
    navigate('/payment-success', { 
      state: { 
        message,
        isBuyNow 
      } 
    });
  };

  const handlePaymentError = () => {
    // Stay on payment page to retry
  };


  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      // For buy now: use only the buy now data, completely ignore cart
      // For regular checkout: use cart data
      let items, subtotal;
      
      if (isBuyNow) {
        // Buy now flow - use only the specific product data
        items = checkoutData?.items || [];
        subtotal = checkoutData?.total || 0;
      } else {
        // Regular cart flow
        items = cart?.items || [];
        subtotal = cart?.totalAmount || 0;
      }
      
      const calculations = calculateOrderTotal(subtotal);
      
      if (items.length === 0 || !user || paymentIntentCreated.current) return;

      // Reset payment intent flag when quantity changes for buy now
      if (isBuyNow) {
        paymentIntentCreated.current = false;
      }
      
      if (paymentIntentCreated.current) return;
      
      paymentIntentCreated.current = true;
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://backend:5000/api'}/payments/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({
            cartItems: items.map((item: any) => ({
              product: {
                _id: item.product?._id || item._id,
                name: item.product?.name || item.name,
                price: item.product?.price || item.price,
                imageUrl: getProductImageUrl(item.product || item),
                category: item.product?.category || item.category
              },
              quantity: item.quantity
            })),
            address: checkoutData?.address || null,
            totalAmount: calculations.total - (discountAmount || 0)
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast.error('Failed to initialize payment. Please try again.');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [cart, user, navigate, checkoutData, isBuyNow]);

  if ((!cart || cart.items.length === 0) && (!checkoutData || !checkoutData.items || checkoutData.items.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No items to checkout
          </h3>
          <p className="mt-2 text-gray-500">
            Add items to your cart before proceeding to payment.
          </p>
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          {isBuyNow ? (
            <>
              <Zap className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold text-gray-900">Buy Now</h1>
              <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                Express Checkout
              </span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            </>
          )}
        </div>
        <Link
          to={isBuyNow ? "/products" : "/cart"}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{isBuyNow ? "Back to Products" : "Back to Cart"}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Payment Form */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Initializing payment...</p>
              </div>
            </div>
          ) : clientSecret ? (
            <Elements 
              stripe={stripePromise} 
              options={{
                clientSecret,
              }}
            >
              <StripePayment
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                isBuyNow={isBuyNow}
                checkoutData={checkoutData}
              />
            </Elements>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Failed to initialize payment. Please try again.</p>
              <Link
                to="/cart"
                className="inline-flex items-center space-x-2 px-4 py-2 mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Cart</span>
              </Link>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>

            {/* Order Items */}
            <div className="space-y-3 mb-4">
              {(isBuyNow ? (checkoutData?.items || []) : (cart?.items || [])).map((item: any) => (
                <div key={item._id || item.product._id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.name || item.product.name} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice((item.price || item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2">
              {(() => {
                const subtotal = isBuyNow ? (checkoutData?.total || 0) : (cart?.totalAmount || 0);
                const calculations = calculateOrderTotal(subtotal);
                return (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatPrice(calculations.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className={`font-medium ${calculations.shipping === 0 ? 'text-green-600' : ''}`}>
                        {calculations.shipping === 0 ? 'Free' : formatPrice(calculations.shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">{formatPrice(calculations.tax)}</span>
                    </div>

                    {/* Subtotal (Full Amount) */}
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between text-base font-semibold">
                        <span>Subtotal</span>
                        <span>{formatPrice(calculations.total)}</span>
                      </div>
                    </div>

                    {/* Discount Display */}
                    {appliedCoupon && discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span className="font-medium">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    {/* Final Total */}
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between text-lg font-bold text-blue-600">
                        <span>Total</span>
                        <span>{formatPrice(calculations.total - (discountAmount || 0))}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Customer Info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Billing Information
              </h3>
              <div className="text-sm text-gray-600">
                <p>{(user as any).name || (user as any).username}</p>
                <p>{(user as any).email}</p>
              </div>
            </div>

            {/* Shipping Address */}
            {checkoutData?.address && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-600">
                  <p>{checkoutData.address.firstName} {checkoutData.address.lastName}</p>
                  <p>{checkoutData.address.address}</p>
                  <p>{checkoutData.address.city}, {checkoutData.address.state} {checkoutData.address.zipCode}</p>
                  <p>{checkoutData.address.country}</p>
                  {checkoutData.address.addressName && (
                    <p className="mt-1 text-xs text-gray-500">
                      {checkoutData.address.addressName} Address
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
