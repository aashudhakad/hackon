import { Request, Response } from 'express';
import { env } from '../config/env';
import { EmptyCartError } from '../errors';
import { withTimeout } from '../utils/async';
import { orderRepository } from '../repositories/orderRepository';
import { Product } from '../types/domain';

type CartItem = Product & { quantity?: number };

/**
 * POST /api/checkout — submit the active cart as an order (Req 12).
 *
 * Accepts line items with optional quantities, rejects empty carts (Req 12.3),
 * computes the total over available items (Req 12.2), enforces the 30s budget
 * (Req 12.5), and records the chosen payment method.
 */
export async function checkout(req: Request, res: Response): Promise<void> {
  const { items, paymentMethod } = req.body as { items: CartItem[]; paymentMethod?: string };

  const available = items.filter((p) => p.availability === 'in-stock');
  if (available.length === 0) {
    throw new EmptyCartError();
  }

  const total = available.reduce((acc, p) => acc + p.price * (p.quantity ?? 1), 0);

  const order = await withTimeout(
    orderRepository.create(available, Math.max(0, total), paymentMethod),
    env.timeouts.checkoutMs,
  );

  res.status(201).json({
    order: {
      id: order.id,
      items: order.items,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
    },
  });
}
