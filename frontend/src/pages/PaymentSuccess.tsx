import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowLeft } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const message = location.state?.message || 'Payment successful!';
  const isBuyNow = location.state?.isBuyNow || false;

  return (
    <div className='max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
      <div className='text-center'>
        {/* Success Icon */}
        <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6'>
          <CheckCircle className='h-8 w-8 text-green-600' />
        </div>

        {/* Success Message */}
        <h1 className='text-3xl font-bold text-gray-900 mb-4'>
          {isBuyNow ? 'Order Successful!' : 'Payment Successful!'}
        </h1>

        <p className='text-lg text-gray-600 mb-8'>{message}</p>

        {/* Additional Info */}
        <div className='bg-gray-50 rounded-lg p-6 mb-8'>
          <div className='flex items-center justify-center space-x-2 text-sm text-gray-600 mb-2'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <span>Payment processed successfully</span>
          </div>
          <div className='flex items-center justify-center space-x-2 text-sm text-gray-600 mb-2'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <span>Order confirmed</span>
          </div>
          <div className='flex items-center justify-center space-x-2 text-sm text-gray-600'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <span>Items will be shipped soon</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Link
            to='/products'
            className='inline-flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium'
          >
            <ShoppingBag className='h-4 w-4' />
            <span>Continue Shopping</span>
          </Link>

          <Link
            to='/orders'
            state={{ fromPaymentSuccess: true }}
            className='inline-flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium'
          >
            <ArrowLeft className='h-4 w-4' />
            <span>View My Orders</span>
          </Link>
        </div>

        {/* Support Info */}
        <div className='mt-8 text-sm text-gray-500'>
          <p>
            Need help? Contact our{' '}
            <Link
              to='/contact'
              className='text-primary-600 hover:text-primary-700'
            >
              support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
