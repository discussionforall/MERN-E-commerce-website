import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { couponAPI } from '../services/api';
import { Coupon, CreateCouponRequest, UpdateCouponRequest } from '../types';
import { X, Calendar, DollarSign, Percent, Users, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface CouponFormProps {
  isOpen: boolean;
  onClose: () => void;
  coupon?: Coupon | null;
  mode: 'create' | 'edit';
}

const CouponForm: React.FC<CouponFormProps> = ({ isOpen, onClose, coupon, mode }) => {
  const [formData, setFormData] = useState<CreateCouponRequest>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minimumOrderAmount: 0,
    maximumDiscountAmount: 0,
    expiryDate: '',
    usageLimit: 0,
    applicableCategories: [],
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (mode === 'edit' && coupon) {
      setFormData({
        code: coupon.code || '',
        description: coupon.description || '',
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue || 0,
        minimumOrderAmount: coupon.minimumOrderAmount || 0,
        maximumDiscountAmount: coupon.maximumDiscountAmount || 0,
        expiryDate: coupon.expiryDate ? (() => {
          const date = new Date(coupon.expiryDate);
          return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
        })() : '',
        usageLimit: coupon.usageLimit || 0,
        applicableCategories: coupon.applicableCategories || [],
      });
    } else {
      // Reset form for create mode
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minimumOrderAmount: 0,
        maximumDiscountAmount: 0,
        expiryDate: '',
        usageLimit: 0,
        applicableCategories: [],
      });
    }
  }, [mode, coupon, isOpen]);

  const createMutation = useMutation(couponAPI.createCoupon, {
    onSuccess: () => {
      toast.success('Coupon created successfully!');
      queryClient.invalidateQueries(['admin-coupons']);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create coupon');
    },
  });

  const updateMutation = useMutation(
    (data: UpdateCouponRequest) => couponAPI.updateCoupon(coupon!._id, data),
    {
      onSuccess: () => {
        toast.success('Coupon updated successfully!');
        queryClient.invalidateQueries(['admin-coupons']);
        onClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update coupon');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (formData.discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }
    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }
    if (!formData.expiryDate) {
      toast.error('Expiry date is required');
      return;
    }
    if (new Date(formData.expiryDate) <= new Date()) {
      toast.error('Expiry date must be in the future');
      return;
    }

    const submitData = {
      ...formData,
      code: formData.code.toUpperCase(),
      minimumOrderAmount: formData.minimumOrderAmount || undefined,
      maximumDiscountAmount: formData.maximumDiscountAmount || undefined,
      usageLimit: formData.usageLimit || undefined,
      applicableCategories: formData.applicableCategories && formData.applicableCategories.length > 0 ? formData.applicableCategories : undefined,
    };

    if (mode === 'create') {
      createMutation.mutate(submitData);
    } else {
      updateMutation.mutate(submitData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else if (name === 'applicableCategories') {
      const categories = value.split(',').map(cat => cat.trim()).filter(cat => cat);
      setFormData(prev => ({
        ...prev,
        applicableCategories: categories
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Create New Coupon' : 'Edit Coupon'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., SAVE20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the coupon offer..."
              required
            />
          </div>

          {/* Discount Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type *
              </label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Value *
              </label>
              <div className="relative">
                {formData.discountType === 'percentage' ? (
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                ) : (
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  min="0"
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  step={formData.discountType === 'percentage' ? 1 : 0.01}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formData.discountType === 'percentage' ? '20' : '50'}
                  required
                />
              </div>
            </div>
          </div>

          {/* Order Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Order Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="minimumOrderAmount"
                  value={formData.minimumOrderAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Discount Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="maximumDiscountAmount"
                  value={formData.maximumDiscountAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable Categories
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="applicableCategories"
                  value={formData.applicableCategories?.join(', ') || ''}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Electronics, Clothing (comma-separated)"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create Coupon' : 'Update Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponForm;
