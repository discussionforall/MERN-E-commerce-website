import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    passwordResetToken: {
      type: String,
      default: undefined,
    },
    passwordResetExpires: {
      type: Date,
      default: undefined,
    },
    profileImage: {
      url: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please provide a valid image URL'],
      },
      publicId: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!(this as any).isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    (this as any).password = await bcrypt.hash((this as any).password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, (this as any).password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = (this as any).toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model<IUser>('User', userSchema);