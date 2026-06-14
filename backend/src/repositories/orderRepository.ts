import { randomUUID } from 'crypto';
import { isMongoConnected } from '../config/db';
import { OrderModel } from '../models/Order';
import { Order, Product } from '../types/domain';

/**
 * Order repository (Task 9.1).
 *
 * Persists submitted orders (Requirements 12.1, 12.2). When Mongo is not
 * connected, orders are kept in memory for the process lifetime so checkout
 * still returns a confirmation.
 */
const memoryOrders = new Map<string, Order>();

export const orderRepository = {
  async create(items: Product[], total: number, paymentMethod?: string, userId?: string): Promise<Order> {
    const currency = items[0]?.currency || 'INR';
    const order: Order = {
      id: randomUUID(),
      userId,
      items,
      total,
      createdAt: new Date().toISOString(),
      status: 'processing', // Start as processing, can be updated later
      paymentMethod,
      currency,
    };

    if (isMongoConnected()) {
      await OrderModel.create(order);
    } else {
      memoryOrders.set(order.id, order);
    }
    return order;
  },

  async findById(id: string): Promise<Order | null> {
    if (isMongoConnected()) {
      const doc = await OrderModel.findOne({ id }).lean<Order>().exec();
      return doc ?? null;
    }
    return memoryOrders.get(id) ?? null;
  },

  async findByUserId(userId: string): Promise<Order[]> {
    if (isMongoConnected()) {
      return OrderModel.find({ userId }).sort({ createdAt: -1 }).lean<Order[]>().exec();
    }
    return Array.from(memoryOrders.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  /**
   * Returns the most recent orders (newest first). Used as a behavior signal
   * for homepage personalization and trending analytics. There is no per-user
   * field on orders yet, so this returns global recent orders.
   */
  async recent(limit = 20): Promise<Order[]> {
    if (isMongoConnected()) {
      return OrderModel.find().sort({ createdAt: -1 }).limit(limit).lean<Order[]>().exec();
    }
    return Array.from(memoryOrders.values())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
  },
};
