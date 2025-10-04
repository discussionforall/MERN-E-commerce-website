import mongoose, { Document, Schema } from 'mongoose';

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string;
    images?: {
      url: string;
      publicId: string;
      alt: string;
      isPrimary: boolean;
    }[];
    category: string;
  };
  quantity: number;
  price: number; // Price at time of purchase
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  addressType: 'home' | 'work' | 'other';
}

export interface Order extends Document {
  _id: string;
  user: string; // User ID
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number; // Discount amount from coupon
  coupon?: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
  };
  total: number;
  paymentIntentId?: string; // Stripe payment intent ID
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  product: {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    images: [{
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      alt: { type: String, default: '' },
      isPrimary: { type: Boolean, default: false }
    }],
    category: { type: String, required: true }
  },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const ShippingAddressSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  addressType: { 
    type: String, 
    enum: ['home', 'work', 'other'], 
    default: 'home' 
  }
}, { _id: false });

const OrderSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [OrderItemSchema],
  shippingAddress: { 
    type: ShippingAddressSchema, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    required: true,
    default: 'stripe'
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  subtotal: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  shipping: { 
    type: Number, 
    required: true, 
    min: 0,
    default: 0
  },
  tax: { 
    type: Number, 
    required: true, 
    min: 0,
    default: 0
  },
  discount: { 
    type: Number, 
    required: true, 
    min: 0,
    default: 0
  },
  coupon: {
    code: { type: String },
    discountType: { 
      type: String, 
      enum: ['percentage', 'fixed'] 
    },
    discountValue: { type: Number },
    discountAmount: { type: Number }
  },
  total: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  paymentIntentId: { 
    type: String 
  },
  trackingNumber: { 
    type: String 
  },
  notes: { 
    type: String 
  }
}, {
  timestamps: true
});

// Index for efficient queries
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ orderStatus: 1 });

export default mongoose.model<Order>('Order', OrderSchema);
