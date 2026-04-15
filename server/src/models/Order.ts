import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  tokenNumber: number;
  customerName: string;
  customerPhone: string;
  items: Array<{
    menuItemId: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentMethod: 'Online' | 'Counter';
  sellerId: mongoose.Types.ObjectId;
  orderTime: Date;
  rating?: number;
  review?: string;
}

const OrderSchema: Schema = new Schema({
  tokenNumber: { type: Number, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  items: [{
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Preparing', 'Ready', 'Completed'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Online', 'Counter'], default: 'Online' },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
  orderTime: { type: Date, default: Date.now },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String }
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);
