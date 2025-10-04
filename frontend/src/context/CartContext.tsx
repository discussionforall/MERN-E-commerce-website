import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { cartAPI, couponAPI } from '../services/api';
import { Cart, Coupon, CouponValidationResponse } from '../types';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  loading: boolean;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  purchaseItems: () => Promise<void>;
  refreshCart: () => Promise<void>;
  applyCoupon: (couponCode: string) => Promise<CouponValidationResponse>;
  removeCoupon: () => void;
  resetCouponState: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const { user } = useAuth();
  const { socket } = useSocket();

  // Load cart when user logs in (only for non-admin users)
  useEffect(() => {
    if (user && user.role !== 'admin') {
      refreshCart();
    } else {
      setCart(null);
      setCartCount(0);
    }
  }, [user]);

  // Socket listeners for real-time cart updates (only for non-admin users)
  useEffect(() => {
    if (!socket || !user || user.role === 'admin') return;

    const handleCartUpdated = (data: { userId: string; cartId: string }) => {
      // Only refresh if it's for the current user
      if (data.userId === user?._id) {
        refreshCart();
      }
    };

    const handleProductsUpdated = () => {
      refreshCart();
    };

    const handleCartCleared = (_data: { message: string; orderId: string }) => {
      // Reset cart state and coupon state
      setCart(null);
      setCartCount(0);
      setAppliedCoupon(null);
      setDiscountAmount(0); 
      toast.success('Cart cleared after successful order!');
    };

    socket.on('cart:updated', handleCartUpdated);
    socket.on('products:updated', handleProductsUpdated);
    socket.on('cart:cleared', handleCartCleared);

    return () => {
      socket.off('cart:updated', handleCartUpdated);
      socket.off('products:updated', handleProductsUpdated);
      socket.off('cart:cleared', handleCartCleared);
    };
  }, [socket, user]);

  const refreshCart = async () => {
    if (!user || user.role === 'admin') return;

    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.cart);
      setCartCount(response.cart.totalItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Don't show error toast for cart fetch failures
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }
    
    if (user.role === 'admin') {
      toast.error('Admin users cannot add items to cart');
      return;
    }

    try {
      setLoading(true);
      const response = await cartAPI.addToCart(productId, quantity);
      setCart(response.cart);
      setCartCount(response.cart.totalItems);
      toast.success(response.message);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(
        error.response?.data?.message || 'Failed to add item to cart'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    if (!user || user.role === 'admin') return;

    try {
      setLoading(true);
      const response = await cartAPI.updateCartItem(productId, quantity);
      setCart(response.cart);
      setCartCount(response.cart.totalItems);

      if (quantity === 0) {
        toast.success('Item removed from cart');
      } else {
        toast.success('Cart updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating cart item:', error);
      toast.error(
        error.response?.data?.message || 'Failed to update cart item'
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user || user.role === 'admin') return;

    try {
      setLoading(true);
      const response = await cartAPI.removeFromCart(productId);
      setCart(response.cart);
      setCartCount(response.cart.totalItems);
      toast.success(response.message);
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      toast.error(
        error.response?.data?.message || 'Failed to remove item from cart'
      );
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user || user.role === 'admin') return;

    try {
      setLoading(true);
      const response = await cartAPI.clearCart();
      setCart(response.cart);
      setCartCount(response.cart.totalItems);
      toast.success(response.message);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      toast.error(error.response?.data?.message || 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  const purchaseItems = async () => {
    if (!user || user.role === 'admin') return;

    try {
      setLoading(true);
      const response = await cartAPI.purchaseItems();
      setCart(response.cart);
      setCartCount(response.cart.totalItems);
      toast.success(
        `Purchase completed! ${response.purchasedItems} items purchased.`
      );
    } catch (error: any) {
      console.error('Error purchasing items:', error);
      toast.error(
        error.response?.data?.message || 'Failed to complete purchase'
      );
    } finally {
      setLoading(false);
    }
  };

  // Apply coupon to cart
  const applyCoupon = async (couponCode: string): Promise<CouponValidationResponse> => {
    if (!user || user.role === 'admin') {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Admin users cannot apply coupons'
      };
    }
    
    if (!cart || cart.items.length === 0) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Cart is empty'
      };
    }

    try {
      // Calculate the final total including shipping and tax
      const { calculateOrderTotal } = await import('../utils/orderCalculations');
      const calculations = calculateOrderTotal(cart.totalAmount);
      const finalTotal = calculations.total;
      
      const cartItems = cart.items.map(item => ({
        product: item.product,
        quantity: item.quantity
      }));

      // Validate finalTotal is a valid number
      if (isNaN(finalTotal) || finalTotal <= 0) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Invalid cart total amount'
        };
      }

      const response = await couponAPI.validateCoupon(couponCode, finalTotal, cartItems);
      
      if (response.isValid) {
        setAppliedCoupon(response.coupon);
        setDiscountAmount(response.discountAmount || 0);
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }

      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to validate coupon';
      toast.error(message);
      return {
        isValid: false,
        discountAmount: 0,
        message
      };
    }
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    toast.success('Coupon removed');
  };

  // Reset coupon state (used when cart is cleared after order)
  const resetCouponState = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  // Clear coupon when cart is cleared
  const clearCartWithCoupon = async () => {
    await clearCart();
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const value: CartContextType = {
    cart,
    cartCount,
    loading,
    appliedCoupon,
    discountAmount,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart: clearCartWithCoupon,
    purchaseItems,
    refreshCart,
    applyCoupon,
    removeCoupon,
    resetCouponState,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
