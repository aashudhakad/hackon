import { Schema, model } from 'mongoose';
import { Order, Product } from '../types/domain';

// Order items are embedded as full normalized product objects; allow all fields.
const OrderItemSchema = new Schema<Product>({}, { _id: false, strict: false });

const OrderSchema = new Schema<Order>(
  {
    id: { type: String, required: true, unique: true, index: true },
    items: { type: [OrderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    createdAt: { type: String, required: true },
    status: { type: String, enum: ['confirmed', 'failed'], required: true },
  },
  { versionKey: false },
);

export const OrderModel = model<Order>('Order', OrderSchema);
