import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one review per user per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Virtual for average rating (will be calculated in aggregation)
ReviewSchema.virtual('averageRating').get(function () {
  return this.rating;
});

export default mongoose.model<IReview>('Review', ReviewSchema);
