import { Request, Response } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { getSocketIO } from '../services/socketService';

// Get user's cart
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name description price imageUrl images stock category',
    });

    if (!cart) {
      // Create empty cart if it doesn't exist
      const newCart = new Cart({ user: userId, items: [] });
      await newCart.save();
      return res.json({ cart: newCart, message: 'Empty cart created' });
    }

    res.json({ cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add item to cart
export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { productId, quantity = 1 } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity < 1 || quantity > 100) {
      return res
        .status(400)
        .json({ message: 'Quantity must be between 1 and 100' });
    }

    // Check if product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Only ${product.stock} items available in stock`,
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update existing item
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          message: `Cannot add ${quantity} more items. Only ${product.stock - cart.items[existingItemIndex].quantity} available`,
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price; // Update price
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
      });
    }

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name description price imageUrl images stock category',
    });

    // Emit real-time update
    const io = getSocketIO();
    io.emit('cart:updated', { userId, cartId: cart._id });

    res.json({
      message: 'Item added to cart successfully',
      cart,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res
        .status(400)
        .json({ message: 'Product ID and quantity are required' });
    }

    if (quantity < 0 || quantity > 100) {
      return res
        .status(400)
        .json({ message: 'Quantity must be between 0 and 100' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity === 0) {
      // Remove item from cart
      cart.items.splice(itemIndex, 1);
    } else {
      // Check stock availability
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Only ${product.stock} items available in stock`,
        });
      }

      // Update quantity and price
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = product.price;
    }

    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name description price imageUrl images stock category',
    });

    // Emit real-time update
    const io = getSocketIO();
    io.emit('cart:updated', { userId, cartId: cart._id });

    res.json({
      message: 'Cart updated successfully',
      cart,
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();
    await cart.populate({
      path: 'items.product',
      select: 'name description price imageUrl images stock category',
    });

    // Emit real-time update
    const io = getSocketIO();
    io.emit('cart:updated', { userId, cartId: cart._id });

    res.json({
      message: 'Item removed from cart successfully',
      cart,
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Clear entire cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    // Emit real-time update
    const io = getSocketIO();
    io.emit('cart:updated', { userId, cartId: cart._id });

    res.json({
      message: 'Cart cleared successfully',
      cart,
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get cart count (for navbar display)
export const getCartCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const cart = await Cart.findOne({ user: userId });
    const count = cart ? cart.totalItems : 0;

    res.json({ count });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Purchase items (checkout) - reduces stock and clears cart
export const purchaseItems = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name description price imageUrl images stock category',
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Check stock availability for all items
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({ message: `Product not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }
    }

    // Update stock for all items
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear the cart
    cart.items = [];
    await cart.save();

    // Emit real-time update
    const io = getSocketIO();
    io.emit('cart:updated', { userId, cartId: cart._id });
    io.emit('products:updated'); // Notify that products were updated

    res.json({
      message: 'Purchase completed successfully',
      cart,
      purchasedItems: cart.items.length,
    });
  } catch (error) {
    console.error('Purchase items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
