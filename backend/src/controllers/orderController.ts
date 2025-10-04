import { Request, Response } from 'express';
import Order, { Order as OrderType } from '../models/Order';
import  Product  from '../models/Product';
import  Cart  from '../models/Cart';
import User from '../models/User';
import Coupon from '../models/Coupon';
import { getSocketIO } from '../services/socketService';

// Create checkout session (for buy now flow)
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    const userId = (req as any).user.id;

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${product.stock}` 
      });
    }

    // Create checkout session data
    const checkoutData = {
      items: [{
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category
        },
        quantity: quantity
      }],
      total: product.price * quantity,
      userId: userId,
      type: 'buy_now'
    };

    res.json({ checkoutData });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { 
      items, 
      shippingAddress, 
      paymentIntentId,
      subtotal,
      shipping,
      tax,
      discount = 0,
      coupon,
      total
    } = req.body;

    const userId = (req as any).user.id;

    // Validate that all products exist and have sufficient stock
    for (const item of items) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(400).json({ 
          message: `Product ${item.product.name} not found` 
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }
    }

    // Create the order
    const order = new Order({
      user: userId,
      items: items.map((item: any) => ({
        product: {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          imageUrl: item.product.imageUrl,
          images: item.product.images || [],
          category: item.product.category
        },
        quantity: item.quantity,
        price: item.product.price
      })),
      shippingAddress,
      paymentMethod: 'stripe',
      paymentStatus: 'completed',
      orderStatus: 'pending',
      subtotal,
      shipping,
      tax,
      discount,
      coupon,
      total,
      paymentIntentId
    });

    await order.save();

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Increment coupon usage count if coupon was applied
    if (coupon && coupon._id) {
      try {
        const updatedCoupon = await Coupon.findByIdAndUpdate(
          coupon._id,
          { $inc: { usedCount: 1 } },
          { new: true }
        );
        
        // Emit socket event for real-time coupon usage updates
        try {
          const io = getSocketIO();
          io.to('admin').emit('coupon:used', { 
            couponId: coupon._id, 
            usedCount: updatedCoupon?.usedCount,
            code: coupon.code
          });
        } catch (socketError) {
          console.error('Socket.IO not available for coupon used event:', socketError);
        }
      } catch (error) {
        console.error('Error incrementing coupon usage:', error);
        // Don't fail the order if coupon update fails
      }
    }

    // Clear user's cart
    await Cart.findOneAndDelete({ user: userId });

    // Emit socket event for new order
    try {
      const io = getSocketIO();
      // Emit to the user who placed the order
      io.to(userId).emit('newOrder', order);
      
      // Emit cart cleared event to reset frontend cart state
      io.to(userId).emit('cart:cleared', { 
        message: 'Cart cleared after successful order',
        orderId: order._id 
      });
      
      // Emit to admins for analytics and admin dashboard
      io.to('admin').emit('newOrder', order);
      io.to('admin').emit('analytics:updated', { type: 'order_created', data: { orderId: order._id, total: order.total } });
    } catch (error) {
      // Socket.IO not available for new order event
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's orders
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query: any = { user: userId };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('user', 'username email');

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalOrders: total,
        hasNext: Number(page) < Math.ceil(total / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get single order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const order = await Order.findOne({ _id: id, user: userId })
      .populate('user', 'username email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, orderStatus, trackingNumber, notes } = req.body;
    const newStatus = status || orderStatus;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status
    const validStatuses = ['pending', 'on-hold', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (newStatus && !validStatuses.includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const updateData: any = {};
    if (newStatus) updateData.orderStatus = newStatus;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes) updateData.notes = notes;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'username email');

    // Emit socket event for order status update
    try {
      const io = getSocketIO();
      
      // Emit to the specific user who placed the order
      if (updatedOrder) {
        const userId = typeof updatedOrder.user === 'object' && updatedOrder.user !== null 
          ? (updatedOrder.user as any)._id.toString() 
          : updatedOrder.user.toString();
        
        io.to(userId).emit('orderStatusUpdated', {
        orderId: id,
        status: newStatus,
        order: updatedOrder
      });
        
      }
      
      // Also emit to admins for analytics
      io.to('admin').emit('analytics:updated', { type: 'order_status_updated', data: { orderId: id, status: newStatus } });
    } catch (error) {
      // Socket.IO not available for order status update event
    }

    res.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all orders (admin only)
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      paymentStatus, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build aggregation pipeline
    const pipeline: any[] = [];

    // Add initial match stage for status and paymentStatus filters
    const initialMatchStage: any = {};
    if (status) initialMatchStage.orderStatus = status;
    if (paymentStatus) initialMatchStage.paymentStatus = paymentStatus;

    // Handle search for order fields and ObjectId before lookup
    if (search) {
      const searchString = String(search);
      
      // Build search conditions array for order fields
      const orderSearchConditions: any[] = [
        { orderStatus: { $regex: searchString, $options: 'i' } },
        { paymentStatus: { $regex: searchString, $options: 'i' } }
      ];
      
      // Check if search term looks like an ObjectId or partial ObjectId
      if (/^[0-9a-fA-F]+$/i.test(searchString)) {
        // Full ObjectId (24 hex characters)
        if (searchString.length === 24) {
          try {
            const mongoose = require('mongoose');
            const searchObjectId = new mongoose.Types.ObjectId(searchString);
            orderSearchConditions.push({ _id: searchObjectId });
          } catch (error) {
            // Invalid ObjectId format
          }
        } else {
          // Partial ObjectId search - find orders with ObjectId containing the search string
          try {
            // Try multiple approaches for partial ObjectId search
            const regexPattern = new RegExp(searchString, 'i');
            
            // Approach 1: Direct regex on _id (might work in some MongoDB versions)
            orderSearchConditions.push({ _id: { $regex: regexPattern } });
            
            // Approach 2: Using $expr with $toString (more reliable)
            orderSearchConditions.push({ 
              $expr: { 
                $regexMatch: { 
                  input: { $toString: "$_id" }, 
                  regex: searchString, 
                  options: "i" 
                } 
              } 
            });
            
          } catch (error) {
            // Error with partial ObjectId search
          }
        }
      }
      
      // First, try to find users that match the search term
      const matchingUsers = await User.find({
        $or: [
          { username: { $regex: searchString, $options: 'i' } },
          { email: { $regex: searchString, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = matchingUsers.map(user => user._id);
      
      // Add user search conditions if any users match
      if (userIds.length > 0) {
        orderSearchConditions.push({ user: { $in: userIds } });
      }
      
      
      // Combine initial match with search conditions
      if (Object.keys(initialMatchStage).length > 0) {
        initialMatchStage.$and = [
          { $or: orderSearchConditions }
        ];
      } else {
        initialMatchStage.$or = orderSearchConditions;
      }
      
    }

    if (Object.keys(initialMatchStage).length > 0) {
      pipeline.push({ $match: initialMatchStage });
    }

    // Add lookup stage to populate user data
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData'
      }
    });

    // Add unwind stage to flatten user data
    pipeline.push({
      $unwind: '$userData'
    });

    // Add sort stage
    const sortStage: any = {};
    sortStage[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({ $sort: sortStage });

    // Add facet stage for pagination and total count
    pipeline.push({
      $facet: {
        orders: [
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) },
          {
            $project: {
              _id: 1,
              items: 1,
              shippingAddress: 1,
              paymentMethod: 1,
              paymentStatus: 1,
              orderStatus: 1,
              trackingNumber: 1,
              notes: 1,
              subtotal: 1,
              shipping: 1,
              tax: 1,
              total: 1,
              createdAt: 1,
              updatedAt: 1,
              user: {
                _id: '$userData._id',
                username: '$userData.username',
                email: '$userData.email'
              }
            }
          }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    });

    const result = await Order.aggregate(pipeline);
    const orders = result[0].orders;
    const total = result[0].totalCount[0]?.count || 0;

    res.json({
      orders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalOrders: total,
        hasNext: Number(page) < Math.ceil(total / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cancel order
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
      return res.status(400).json({ 
        message: 'Cannot cancel this order' 
      });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: item.quantity } }
      );
    }

    order.orderStatus = 'cancelled';
    order.paymentStatus = 'refunded';
    await order.save();

    // Emit socket event for order cancellation
    try {
      const io = getSocketIO();
      
      // Emit to the specific user who placed the order
      io.to(order.user.toString()).emit('orderCancelled', {
        orderId: id,
        order
      });
      
      // Also emit to admins for analytics
      io.to('admin').emit('analytics:updated', { type: 'order_cancelled', data: { orderId: id } });
      
    } catch (error) {
      // Socket.IO not available for order cancellation event
    }

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
