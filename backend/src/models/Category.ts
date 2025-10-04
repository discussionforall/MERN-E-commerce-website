import mongoose, { Schema } from 'mongoose';

export interface ICategory {
  _id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Category name must be at least 2 characters long'],
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICategory>('Category', categorySchema);
