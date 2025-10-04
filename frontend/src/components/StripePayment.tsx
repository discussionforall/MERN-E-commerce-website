import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductImageUrl } from '../utils/imageUtils';
import { orderAPI } from '../services/api';
import { calculateOrderTotal } from '../utils/orderCalculations';
import { Loader2 } from 'lucide-react';

interface StripePaymentProps {
  onPaymentSuccess: () => void;
  onPaymentError: () => void;
  isBuyNow?: boolean;
  checkoutData?: any;
}

const StripePayment: React.FC<StripePaymentProps> = ({
  onPaymentSuccess,
  onPaymentError,
  isBuyNow = false,
  checkoutData = null,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { cart, refreshCart, appliedCoupon, discountAmount, resetCouponState } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    // For buy now flow, we don't need cart data
    if (!isBuyNow && !cart) {
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment failed:', error);
        toast.error(`Payment failed: ${error.message}`);
        onPaymentError();
      } else if (paymentIntent?.status === 'succeeded') {
        try {
          // Create order in database
          let orderData;
          
          if (isBuyNow && checkoutData) {
            // Buy now flow - use checkout data
            const address = checkoutData.address || {
              firstName: 'N/A',
              lastName: 'N/A',
              email: 'N/A',
              phone: 'N/A',
              address: 'N/A',
              city: 'N/A',
              state: 'N/A',
              zipCode: 'N/A',
              country: 'N/A',
              addressType: 'home'
            };
            
            const calculations = calculateOrderTotal(checkoutData.total);
            
            orderData = {
              items: checkoutData.items.map((item: any) => ({
                product: {
                  _id: item.product._id,
                  name: item.product.name,
                  price: item.product.price,
                  imageUrl: getProductImageUrl(item.product) || '',
                  category: item.product.category
                },
                quantity: item.quantity,
                price: item.product.price
              })),
              shippingAddress: address,
              paymentIntentId: paymentIntent.id,
              subtotal: calculations.subtotal,
              shipping: calculations.shipping,
              tax: calculations.tax,
              discount: discountAmount || 0,
              coupon: appliedCoupon ? {
                code: appliedCoupon.code,
                discountType: appliedCoupon.discountType,
                discountValue: appliedCoupon.discountValue,
                discountAmount: discountAmount || 0
              } : undefined,
              total: calculations.total - (discountAmount || 0)
            };
          } else {
            // Cart flow - use cart data
            const address = checkoutData?.address || null;
            const calculations = calculateOrderTotal(cart?.totalAmount || 0);
            
            orderData = {
              items: cart?.items.map(item => ({
                product: {
                  _id: item.product._id,
                  name: item.product.name,
                  price: item.product.price,
                  imageUrl: getProductImageUrl(item.product) || '',
                  category: item.product.category
                },
                quantity: item.quantity,
                price: item.product.price
              })),
              shippingAddress: address || {
                firstName: 'N/A',
                lastName: 'N/A',
                email: 'N/A',
                phone: 'N/A',
                address: 'N/A',
                city: 'N/A',
                state: 'N/A',
                zipCode: 'N/A',
                country: 'N/A',
                addressType: 'home'
              },
              paymentIntentId: paymentIntent?.id || '',
              subtotal: calculations.subtotal,
              shipping: calculations.shipping,
              tax: calculations.tax,
              discount: discountAmount || 0,
              coupon: appliedCoupon ? {
                code: appliedCoupon.code,
                discountType: appliedCoupon.discountType,
                discountValue: appliedCoupon.discountValue,
                discountAmount: discountAmount || 0
              } : undefined,
              total: calculations.total - (discountAmount || 0)
            };
          }

          await orderAPI.createOrder(orderData);
          
          // Only refresh cart for regular cart flow, not buy now
          if (!isBuyNow) {
            await refreshCart();
            // Reset coupon state after successful order
            resetCouponState();
          }
          
          toast.success('Payment successful! Order created.');
          onPaymentSuccess();
        } catch (error) {
          console.error('Error creating order:', error);
          toast.error('Payment successful but failed to create order. Please contact support.');
          onPaymentSuccess(); // Still redirect to success page
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('An error occurred during payment');
      onPaymentError();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Details
        </h3>
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <span>Pay ${(() => {
            if (isBuyNow && checkoutData) {
              const calculations = calculateOrderTotal(checkoutData.total);
              return (calculations.total - (discountAmount || 0)).toFixed(2);
            } else {
              const calculations = calculateOrderTotal(cart?.totalAmount || 0);
              return (calculations.total - (discountAmount || 0)).toFixed(2);
            }
          })()}</span>
        )}
      </button>

      <div className="text-sm text-gray-500 text-center">
        <p>🔒 Your payment information is secure and encrypted</p>
        <p>Powered by Stripe</p>
      </div>
    </form>
  );
};

export default StripePayment;
