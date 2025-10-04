import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Tag, X, Check } from 'lucide-react';

const CouponInput: React.FC = () => {
  const { appliedCoupon, discountAmount, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplying(true);
    try {
      await applyCoupon(couponCode.trim().toUpperCase());
      setCouponCode('');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Coupon Applied: {appliedCoupon.code}
              </p>
              <p className="text-xs text-green-600">
                {appliedCoupon.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-green-800">
              -${(discountAmount || 0).toFixed(2)}
            </span>
            <button
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-800 transition-colors"
              title="Remove coupon"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleApplyCoupon} className="space-y-2">
      <div className="flex space-x-2">
        <div className="flex-1">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isApplying}
          />
        </div>
        <button
          type="submit"
          disabled={!couponCode.trim() || isApplying}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          <Tag className="h-4 w-4" />
          <span>{isApplying ? 'Applying...' : 'Apply'}</span>
        </button>
      </div>
    </form>
  );
};

export default CouponInput;
