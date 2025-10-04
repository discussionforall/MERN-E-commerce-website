import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../types';

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [
        10,
        'Product description must be at least 10 characters long',
      ],
      maxlength: [1000, 'Product description cannot exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          // If imageUrl is provided, it must be a valid URL
          // If not provided, it's optional (we can use images array instead)
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid image URL'
      }
    },
    images: [{
      url: {
        type: String,
        required: true,
        match: [/^https?:\/\/.+/, 'Please provide a valid image URL'],
      },
      publicId: {
        type: String,
        required: true,
      },
      alt: {
        type: String,
        default: '',
      },
      isPrimary: {
        type: Boolean,
        default: false,
      }
    }],
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    createdBy: {
      type: String,
      required: [true, 'Creator ID is required'],
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Custom validation to ensure at least one image is provided
productSchema.pre('validate', function(next) {
  const hasImageUrl = this.imageUrl && this.imageUrl.trim() !== '';
  const hasImages = this.images && this.images.length > 0;
  
  if (!hasImageUrl && !hasImages) {
    this.invalidate('imageUrl', 'Either imageUrl or images array must be provided');
  }
  
  next();
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ createdBy: 1 });
productSchema.index({ category: 1 });

export default mongoose.model<IProduct>('Product', productSchema);
