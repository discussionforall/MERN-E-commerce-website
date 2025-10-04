import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  refreshTokens: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  profileImage?: {
    url: string;
    publicId: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IProduct extends Document {
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
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
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

export interface SocketData {
  userId: string;
  role: string;
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
  createdAt: Date;
  updatedAt: Date;
}
