import { Request, Response } from 'express';
import { orderRepository } from '../repositories/orderRepository';
import { AppError } from '../errors';

/**
 * GET /api/orders — get authenticated user's orders
 * 
 * Returns list of orders for the authenticated user, sorted by most recent first.
 * Requires authentication middleware.
 */
export async function getUserOrders(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.userId;
  
  if (!userId) {
    throw new AppError('User ID not found', 401, 'UNAUTHORIZED');
  }

  const orders = await orderRepository.findByUserId(userId);
  
  res.json({ orders });
}

/**
 * GET /api/orders/:id — get a specific order by ID
 * 
 * Returns order details if it belongs to the authenticated user.
 * Requires authentication middleware.
 */
export async function getOrderById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req as any).user?.userId;
  
  if (!userId) {
    throw new AppError('User ID not found', 401, 'UNAUTHORIZED');
  }

  const order = await orderRepository.findById(id);
  
  if (!order) {
    throw new AppError('Order not found', 404, 'NOT_FOUND');
  }
  
  // Verify ownership
  if (order.userId !== userId) {
    throw new AppError('Order not found', 404, 'NOT_FOUND'); // Don't reveal that order exists
  }
  
  res.json({ order });
}
