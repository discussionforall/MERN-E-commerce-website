import axios from 'axios';
import {
  AuthResponse,
  RefreshTokenResponse,
  LoginRequest, 
  RegisterRequest,
  ProductsResponse,
  ProductRequest,
  Product,
  Cart,
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
  CreateCouponRequest,
  UpdateCouponRequest,
} from '../types/index.js';
import { navigateTo } from '../utils/navigation';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://backend:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    // Don't add auth token for login, register, forgot-password, or reset-password endpoints
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
    const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (!isAuthEndpoint) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        processQueue(error, null);
        navigateTo('/login', { replace: true });
        return Promise.reject(error);
      }

      try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        processQueue(refreshError, null);
        navigateTo('/login', { replace: true });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // Create a fresh axios instance for login to avoid any interceptor issues
    const loginApi = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://backend:5000/api',
      timeout: 10000,
    });
    
    const response = await loginApi.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },

  logoutAll: async () => {
    const response = await api.post('/auth/logout-all');
    return response.data;
  },

  getProfile: async (): Promise<{ user: any }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: { username?: string; email?: string; profileImage?: { url: string; publicId: string } }) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string, confirmPassword: string) => {
    const response = await api.post('/auth/reset-password', { 
      token, 
      password, 
      confirmPassword 
    });
    return response.data;
  },
};

export const productAPI = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    availability?: 'in-stock' | 'out-of-stock';
    sortBy?: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name' | 'popularity';
    minPrice?: number;
    maxPrice?: number;
  }): Promise<ProductsResponse> => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getSearchSuggestions: async (query: string): Promise<{ suggestions: Array<{ type: 'product' | 'category'; value: string }> }> => {
    const response = await api.get('/products/search-suggestions', { 
      params: { q: query } 
    });
    return response.data;
  },

  getProductById: async (id: string): Promise<{ product: Product }> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (
    data: ProductRequest
  ): Promise<{ message: string; product: Product }> => {
    const response = await api.post('/products', data);
    return response.data;
  },

  updateProduct: async (
    id: string,
    data: ProductRequest
  ): Promise<{ message: string; product: Product }> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  getMyProducts: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ProductsResponse> => {
    const response = await api.get('/products/my/products', { params });
    return response.data;
  },

  // Deprecated: Use categoryAPI.getCategories() instead
  getCategories: async (): Promise<{ categories: string[] }> => {
    console.warn('productAPI.getCategories() is deprecated. Use categoryAPI.getCategories() instead.');
    const response = await api.get('/products/categories');
    return response.data;
  },

  // CSV Import/Export functions
  exportProductsToCSV: async (): Promise<Blob> => {
    const response = await api.get('/products/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  getCSVTemplate: async (): Promise<Blob> => {
    const response = await api.get('/products/template/csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  importProductsFromCSV: async (file: File): Promise<{
    message: string;
    results: {
      success: number;
      failed: number;
      errors: string[];
    };
  }> => {
    const formData = new FormData();
    formData.append('csvFile', file);
    
    const response = await api.post('/products/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const cartAPI = {
  getCart: async (): Promise<{ cart: Cart }> => {
    const response = await api.get('/cart');
    return response.data;
  },

  getCartCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/cart/count');
    return response.data;
  },

  addToCart: async (
    productId: string,
    quantity: number = 1
  ): Promise<{ message: string; cart: Cart }> => {
    const response = await api.post('/cart/add', { productId, quantity });
    return response.data;
  },

  updateCartItem: async (
    productId: string,
    quantity: number
  ): Promise<{ message: string; cart: Cart }> => {
    const response = await api.put('/cart/update', { productId, quantity });
    return response.data;
  },

  removeFromCart: async (
    productId: string
  ): Promise<{ message: string; cart: Cart }> => {
    const response = await api.delete(`/cart/remove/${productId}`);
    return response.data;
  },

  clearCart: async (): Promise<{ message: string; cart: Cart }> => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },

  purchaseItems: async (): Promise<{
    message: string;
    cart: Cart;
    purchasedItems: number;
  }> => {
    const response = await api.post('/cart/purchase');
    return response.data;
  },
};

// Order API
export const orderAPI = {
  createOrder: async (orderData: any) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getUserOrders: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string 
  }) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id: string) => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  },

  // Admin APIs
  getAllOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/orders/admin/all', { params });
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  createCheckoutSession: async (productId: string, quantity: number) => {
    const response = await api.post('/orders/checkout-session', { productId, quantity });
    return response.data;
  },
};

// Address API
export const addressAPI = {
  getUserAddresses: async (): Promise<{ addresses: Address[]; total: number }> => {
    const response = await api.get('/addresses');
    return response.data;
  },
  
  createAddress: async (addressData: CreateAddressRequest) => {
    const response = await api.post('/addresses', addressData);
    return response.data;
  },
  
  updateAddress: async (id: string, addressData: UpdateAddressRequest) => {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data;
  },
  
  deleteAddress: async (id: string) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },
  
  setDefaultAddress: async (id: string) => {
    const response = await api.patch(`/addresses/${id}/default`);
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getAnalytics: async (period?: string) => {
    const response = await api.get('/analytics', { 
      params: period ? { period } : {} 
    });
    return response.data;
  },
};

// Review API
export const reviewAPI = {
  getProductReviews: async (productId: string, page = 1, limit = 10) => {
    const response = await api.get(`/reviews/product/${productId}`, {
      params: { page, limit }
    });
    return response.data;
  },
  
  createReview: async (productId: string, rating: number, comment: string) => {
    const response = await api.post(`/reviews/product/${productId}`, {
      rating,
      comment
    });
    return response.data;
  },
  
  updateReview: async (reviewId: string, rating: number, comment: string) => {
    const response = await api.put(`/reviews/${reviewId}`, {
      rating,
      comment
    });
    return response.data;
  },
  
  deleteReview: async (reviewId: string) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
  
  getUserReview: async (productId: string) => {
    const response = await api.get(`/reviews/product/${productId}/user`);
    return response.data;
  },
};

// Wishlist API
export const wishlistAPI = {
  getUserWishlist: async (page = 1, limit = 20) => {
    const response = await api.get('/wishlist', {
      params: { page, limit }
    });
    return response.data;
  },
  
  addToWishlist: async (productId: string) => {
    const response = await api.post(`/wishlist/${productId}`);
    return response.data;
  },
  
  removeFromWishlist: async (productId: string) => {
    const response = await api.delete(`/wishlist/${productId}`);
    return response.data;
  },
  
  checkWishlistStatus: async (productId: string) => {
    const response = await api.get(`/wishlist/check/${productId}`);
    return response.data;
  },
  
  toggleWishlist: async (productId: string) => {
    const response = await api.post(`/wishlist/toggle/${productId}`);
    return response.data;
  },
};

// Coupon API
export const couponAPI = {
  // Get all coupons (admin only)
  getCoupons: async (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) => {
    const response = await api.get('/coupons', { params });
    return response.data;
  },

  // Get single coupon by ID
  getCouponById: async (id: string) => {
    const response = await api.get(`/coupons/${id}`);
    return response.data;
  },

  // Create new coupon (admin only)
  createCoupon: async (couponData: CreateCouponRequest) => {
    const response = await api.post('/coupons', couponData);
    return response.data;
  },

  // Update coupon (admin only)
  updateCoupon: async (id: string, couponData: UpdateCouponRequest) => {
    const response = await api.put(`/coupons/${id}`, couponData);
    return response.data;
  },

  // Delete coupon (admin only)
  deleteCoupon: async (id: string) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },

  // Validate coupon code
  validateCoupon: async (code: string, orderAmount: number, cartItems?: any[]) => {
    const response = await api.post('/coupons/validate', {
      code,
      orderAmount,
      cartItems
    });
    return response.data;
  },

  // Apply coupon (increment usage count)
  applyCoupon: async (couponId: string) => {
    const response = await api.post('/coupons/apply', { couponId });
    return response.data;
  },
};

// Category API - Simplified unified system
export const categoryAPI = {
  // Get all categories (both user and admin)
  getCategories: async (): Promise<{ categories: Array<{ _id: string; name: string }> }> => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Create new category (admin only)
  createCategory: async (categoryData: {
    name: string;
  }): Promise<{ message: string; category: { _id: string; name: string } }> => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  // Update category (admin only)
  updateCategory: async (id: string, categoryData: {
    name: string;
  }): Promise<{ message: string; category: { _id: string; name: string } }> => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },
};

export default api;
