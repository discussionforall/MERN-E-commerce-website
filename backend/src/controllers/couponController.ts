import { Request, Response } from 'express';
import Coupon, { ICoupon } from '../models/Coupon';
import { getSocketIO } from '../services/socketService';

// Get all coupons (admin only)
export const getAllCoupons = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const coupons = await Coupon.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Coupon.countDocuments(query);

    res.json({
      coupons,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalCoupons: total,
        hasNext: skip + coupons.length < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Get all coupons error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get single coupon by ID
export const getCouponById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const coupon = await Coupon.findById(id).populate('createdBy', 'username');
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ coupon });
  } catch (error) {
    console.error('Get coupon by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new coupon (admin only)
export const createCoupon = async (req: Request, res: Response) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscountAmount,
      expiryDate,
      usageLimit,
      applicableCategories
    } = req.body;

    const createdBy = (req as any).user._id;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    // Validate expiry date
    if (new Date(expiryDate) <= new Date()) {
      return res.status(400).json({ message: 'Expiry date must be in the future' });
    }

    // Validate discount value
    if (discountValue <= 0) {
      return res.status(400).json({ message: 'Discount value must be greater than 0' });
    }

    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minimumOrderAmount: minimumOrderAmount || 0,
      maximumDiscountAmount,
      expiryDate: new Date(expiryDate),
      usageLimit,
      applicableCategories,
      createdBy
    });

    await coupon.save();

    // Emit socket event for real-time updates
    try {
      const io = getSocketIO();
      // Emit to all users for coupon notification
      io.emit('coupon:created', {
        coupon,
        message: `New coupon "${coupon.code}" is now available! ${coupon.description}`
      });
      // Emit to admins for analytics
      io.to('admin').emit('analytics:updated', { 
        type: 'coupon_created', 
        data: { couponId: coupon._id, code: coupon.code } 
      });
    } catch (error) {
      console.error('Socket.IO not available for coupon created event:', error);
    }

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon
    });
    } catch (error: any) {
      console.error('Create coupon error:', error);
      if (error.code === 11000) {
        res.status(400).json({ message: 'Coupon code already exists' });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
};

// Update coupon (admin only)
export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If updating code, check for duplicates
    if (updateData.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingCoupon) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Validate expiry date if updating
    if (updateData.expiryDate && new Date(updateData.expiryDate) <= new Date()) {
      return res.status(400).json({ message: 'Expiry date must be in the future' });
    }

    // Validate discount value if updating
    if (updateData.discountValue !== undefined) {
      if (updateData.discountValue <= 0) {
        return res.status(400).json({ message: 'Discount value must be greater than 0' });
      }
      if (updateData.discountType === 'percentage' && updateData.discountValue > 100) {
        return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Emit socket event for real-time updates
    try {
      const io = getSocketIO();
      io.to('admin').emit('coupon:updated', coupon);
    } catch (error) {
      console.error('Socket.IO not available for coupon updated event:', error);
    }

    res.json({
      message: 'Coupon updated successfully',
      coupon
    });
    } catch (error: any) {
      console.error('Update coupon error:', error);
      if (error.code === 11000) {
        res.status(400).json({ message: 'Coupon code already exists' });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
};

// Delete coupon (admin only)
export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Emit socket event for real-time updates
    try {
      const io = getSocketIO();
      io.to('admin').emit('coupon:deleted', id);
    } catch (error) {
      console.error('Socket.IO not available for coupon deleted event:', error);
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Validate coupon code
export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code, orderAmount, cartItems } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({ 
        message: 'Coupon code and order amount are required' 
      });
    }

    // Validate orderAmount is a valid number
    const numericOrderAmount = Number(orderAmount);
    if (isNaN(numericOrderAmount) || numericOrderAmount <= 0) {
      return res.status(400).json({
        isValid: false,
        discountAmount: 0,
        message: 'Invalid order amount'
      });
    }

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({
        isValid: false,
        discountAmount: 0,
        message: 'Invalid coupon code'
      });
    }

    // Check if coupon is expired
    if (new Date() > coupon.expiryDate) {
      return res.json({
        isValid: false,
        discountAmount: 0,
        message: 'Coupon has expired'
      });
    }

    // Check if usage limit is reached
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.json({
        isValid: false,
        discountAmount: 0,
        message: 'Coupon usage limit reached'
      });
    }

    // Check minimum order amount
    if (coupon.minimumOrderAmount && numericOrderAmount < coupon.minimumOrderAmount) {
      return res.json({
        isValid: false,
        discountAmount: 0,
        message: `Minimum order amount of $${coupon.minimumOrderAmount} required`
      });
    }

    // Check applicable categories if specified
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const cartCategories = cartItems?.map((item: any) => item.product?.category) || [];
      const hasApplicableCategory = cartCategories.some((category: string) => 
        coupon.applicableCategories!.includes(category)
      );
      
      if (!hasApplicableCategory) {
        return res.json({
          isValid: false,
          discountAmount: 0,
          message: 'Coupon not applicable to items in cart'
        });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    
    if (coupon.discountType === 'percentage') {
      discountAmount = (numericOrderAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    // Apply maximum discount limit if set
    if (coupon.maximumDiscountAmount && discountAmount > coupon.maximumDiscountAmount) {
      discountAmount = coupon.maximumDiscountAmount;
    }

    // Don't exceed order amount
    discountAmount = Math.min(discountAmount, numericOrderAmount);

    // Ensure discount amount is a valid number
    if (isNaN(discountAmount) || discountAmount < 0) {
      discountAmount = 0;
    }

    res.json({
      isValid: true,
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      message: `Discount of $${Math.round(discountAmount * 100) / 100} applied`,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maximumDiscountAmount: coupon.maximumDiscountAmount
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Apply coupon (increment usage count)
export const applyCoupon = async (req: Request, res: Response) => {
  try {
    const { couponId } = req.body;

    const coupon = await Coupon.findById(couponId);
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check if coupon is still valid
    if (!coupon.isActive || new Date() > coupon.expiryDate || (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)) {
      return res.status(400).json({ message: 'Coupon is no longer valid' });
    }

    // Increment usage count
    coupon.usedCount += 1;
    await coupon.save();

    // Emit socket event for real-time updates
    try {
      const io = getSocketIO();
      io.to('admin').emit('coupon:used', { couponId, usedCount: coupon.usedCount });
    } catch (error) {
      console.error('Socket.IO not available for coupon used event:', error);
    }

    res.json({ 
      message: 'Coupon applied successfully',
      usedCount: coupon.usedCount
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
