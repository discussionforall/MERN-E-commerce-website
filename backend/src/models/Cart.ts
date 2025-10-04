import mongoose, { Schema } from 'mongoose';

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // Store price at time of adding to cart
}

export interface ICart {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  totalItems: number;
}

const cartItemSchema = new Schema<ICartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    max: [100, 'Quantity cannot exceed 100'],
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
});

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Each user has only one cart
    },
    items: [cartItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },
    totalItems: {
      type: Number,
      default: 0,
      min: [0, 'Total items cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.product': 1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function (next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  next();
});

export default mongoose.model<ICart>('Cart', cartSchema);
