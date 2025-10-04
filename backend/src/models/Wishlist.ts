import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlist extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  createdAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one wishlist entry per user per product
WishlistSchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.model<IWishlist>('Wishlist', WishlistSchema);
