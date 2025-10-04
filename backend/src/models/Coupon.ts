import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  expiryDate: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableCategories?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minimumOrderAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  maximumDiscountAmount: {
    type: Number,
    min: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    min: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableCategories: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
couponSchema.index({ code: 1 });
couponSchema.index({ expiryDate: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ createdBy: 1 });

// Virtual for checking if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Virtual for checking if coupon has reached usage limit
couponSchema.virtual('isUsageLimitReached').get(function() {
  return this.usageLimit && this.usedCount >= this.usageLimit;
});

// Virtual for checking if coupon is valid
couponSchema.virtual('isValid').get(function() {
  const isExpired = new Date() > this.expiryDate;
  const isUsageLimitReached = this.usageLimit && this.usedCount >= this.usageLimit;
  return this.isActive && !isExpired && !isUsageLimitReached;
});

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount: number): number {
  const isExpired = new Date() > this.expiryDate;
  const isUsageLimitReached = this.usageLimit && this.usedCount >= this.usageLimit;
  const isValid = this.isActive && !isExpired && !isUsageLimitReached;
  
  if (!isValid || orderAmount < (this.minimumOrderAmount || 0)) {
    return 0;
  }

  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
  } else {
    discount = this.discountValue;
  }

  // Apply maximum discount limit if set
  if (this.maximumDiscountAmount && discount > this.maximumDiscountAmount) {
    discount = this.maximumDiscountAmount;
  }

  // Don't exceed order amount
  return Math.min(discount, orderAmount);
};

// Method to increment usage count
couponSchema.methods.incrementUsage = function() {
  this.usedCount += 1;
  return this.save();
};

export default mongoose.model<ICoupon>('Coupon', couponSchema);
