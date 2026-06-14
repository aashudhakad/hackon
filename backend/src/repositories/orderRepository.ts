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
  async create(items: Product[], total: number, paymentMethod?: string): Promise<Order> {
    const order: Order = {
      id: randomUUID(),
      items,
      total,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      paymentMethod,
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
};
