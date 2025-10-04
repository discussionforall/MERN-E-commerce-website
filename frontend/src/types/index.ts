export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  profileImage?: {
    url: string;
    publicId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  userId: string;
  addressName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  addressName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  addressName?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  expiryDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableCategories?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponRequest {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  expiryDate: string;
  usageLimit?: number;
  applicableCategories?: string[];
}

export interface UpdateCouponRequest {
  code?: string;
  description?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  expiryDate?: string;
  usageLimit?: number;
  isActive?: boolean;
  applicableCategories?: string[];
}

export interface CouponValidationResponse {
  isValid: boolean;
  discountAmount: number;
  message?: string;
  coupon?: Coupon;
}

export interface Review {
  _id: string;
  product: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  _id: string;
  user: string;
  product: Product;
  createdAt: string;
}

export interface ReviewResponse {
  reviews: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  averageRating: number;
}

export interface WishlistResponse {
  wishlistItems: WishlistItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  images?: {
    url: string;
    publicId: string;
    alt: string;
    isPrimary: boolean;
  }[];
  cloudinaryPublicId?: string;
  stock: number;
  createdBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  message: string;
  accessToken: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  images?: {
    url: string;
    publicId: string;
    alt: string;
    isPrimary: boolean;
  }[];
  cloudinaryPublicId?: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateProfile: (data: { username?: string; email?: string; profileImage?: { url: string; publicId: string } }) => Promise<void>;
  loading: boolean;
  getUserAddresses: () => Promise<Address[]>;
  createAddress: (addressData: CreateAddressRequest) => Promise<void>;
  updateAddress: (id: string, addressData: UpdateAddressRequest) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}
