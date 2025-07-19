import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  address: string;
  nonce: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    nonce: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ address: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
