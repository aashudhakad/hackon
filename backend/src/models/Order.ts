import { Schema, model } from 'mongoose';
import { Order, Product } from '../types/domain';

// Order items are embedded as full normalized product objects; allow all fields.
const OrderItemSchema = new Schema<Product>({}, { _id: false, strict: false });

const OrderSchema = new Schema<Order>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: false, index: true }, // User who placed the order
    items: { type: [OrderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    createdAt: { type: String, required: true },
    status: { type: String, enum: ['confirmed', 'processing', 'in-transit', 'delivered', 'failed'], required: true },
    paymentMethod: { type: String, required: false },
    currency: { type: String, default: 'INR' },
  },
  { versionKey: false },
);

// Index for fetching user's orders efficiently
OrderSchema.index({ userId: 1, createdAt: -1 });

export const OrderModel = model<Order>('Order', OrderSchema);
