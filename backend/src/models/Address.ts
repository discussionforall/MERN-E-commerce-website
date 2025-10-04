import mongoose, { Schema } from 'mongoose';

export interface IAddress {
  _id: string;
  userId: mongoose.Types.ObjectId;
  addressName: string; // "Home", "Office", "Mom's House", etc.
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

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // For efficient queries by userId
    },
    addressName: {
      type: String,
      required: [true, 'Address name is required'],
      trim: true,
      maxlength: [50, 'Address name cannot exceed 50 characters'],
    },
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State name cannot exceed 100 characters'],
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true,
      maxlength: [20, 'ZIP code cannot exceed 20 characters'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'India',
      maxlength: [100, 'Country name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
addressSchema.index({ userId: 1, isDefault: 1 });

// Ensure only one default address per user
addressSchema.pre('save', async function (next) {
  if ((this as any).isDefault) {
    // Remove default flag from other addresses of the same user
    await mongoose
      .model('Address')
      .updateMany(
        { userId: (this as any).userId, _id: { $ne: (this as any)._id } },
        { isDefault: false }
      );
  }
  next();
});

export default mongoose.model<IAddress>('Address', addressSchema);
