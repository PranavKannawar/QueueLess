import mongoose, { Schema, Document } from 'mongoose';

export interface ISeller extends Document {
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  password?: string;
  category: string;
  location: string;
  upiId: string;
  shopImage?: string;
  qrCode?: string;
  shortCode: string;
  avgRating: number;
  totalRatings: number;
  tokenSequence: number;
  trialEndsAt: Date;
  subscriptionStatus: 'Trial' | 'Active' | 'Expired';
  isPhoneVerified: boolean;
  otp?: string;
  otpExpiresAt?: Date;
}

const SellerSchema: Schema = new Schema({
  shopName: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  category: { type: String },
  location: { type: String },
  upiId: { type: String },
  shopImage: { type: String },
  qrCode: { type: String },
  shortCode: { type: String, unique: true, sparse: true },
  avgRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  tokenSequence: { type: Number, default: 0 },
  trialEndsAt: { type: Date, default: () => new Date(+new Date() + 3*24*60*60*1000) }, // 3 days trial
  subscriptionStatus: { type: String, enum: ['Trial', 'Active', 'Expired'], default: 'Trial' },
  isPhoneVerified: { type: Boolean, default: true },
  otp: { type: String },
  otpExpiresAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<ISeller>('Seller', SellerSchema);
