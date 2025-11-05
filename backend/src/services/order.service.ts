import { PrismaClient, OrderType, OrderStatus, MembershipType, Order } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * 订单管理服务
 * 处理会员购买和按次付费订单的创建、查询和更新
 */
export class OrderService {
  /**
   * 生成订单号
   * 格式：yyyyMMddHHmmss + 6位随机数
   */
  private generateOrderNo(): string {
    const now = new Date();
    const datePart = now
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .substring(0, 14); // yyyyMMddHHmmss
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${datePart}${randomPart}`;
  }

  /**
   * 创建会员订单
   */
  async createMembershipOrder(params: {
    userId: string;
    membershipType: MembershipType;
    amount: number;
  }): Promise<Order> {
    const { userId, membershipType, amount } = params;

    if (membershipType === 'FREE') {
      throw new Error('Cannot create order for FREE membership');
    }

    const orderNo = this.generateOrderNo();

    try {
      const order = await prisma.order.create({
        data: {
          orderNo,
          userId,
          orderType: OrderType.MEMBERSHIP,
          membershipType,
          quantity: 1,
          amount,
          status: OrderStatus.PENDING,
          paymentMethod: 'WECHAT_PAY',
        },
      });

      logger.info('Membership order created', {
        orderId: order.id,
        orderNo: order.orderNo,
        userId,
        membershipType,
        amount,
      });

      return order;
    } catch (error) {
      logger.error('Failed to create membership order', { error, userId, membershipType });
      throw new Error('Failed to create membership order');
    }
  }

  /**
   * 创建按次付费订单
   */
  async createPayPerUseOrder(params: {
    userId: string;
    quantity: number;
    amount: number;
  }): Promise<Order> {
    const { userId, quantity, amount } = params;

    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const orderNo = this.generateOrderNo();

    try {
      const order = await prisma.order.create({
        data: {
          orderNo,
          userId,
          orderType: OrderType.PAY_PER_USE,
          quantity,
          amount,
          status: OrderStatus.PENDING,
          paymentMethod: 'WECHAT_PAY',
        },
      });

      logger.info('Pay-per-use order created', {
        orderId: order.id,
        orderNo: order.orderNo,
        userId,
        quantity,
        amount,
      });

      return order;
    } catch (error) {
      logger.error('Failed to create pay-per-use order', { error, userId, quantity });
      throw new Error('Failed to create pay-per-use order');
    }
  }

  /**
   * 根据订单号查询订单
   */
  async getOrderByOrderNo(orderNo: string): Promise<Order | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { orderNo },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              openId: true,
            },
          },
        },
      });

      return order;
    } catch (error) {
      logger.error('Failed to get order by orderNo', { error, orderNo });
      throw new Error('Failed to get order');
    }
  }

  /**
   * 根据订单ID查询订单
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              openId: true,
            },
          },
        },
      });

      return order;
    } catch (error) {
      logger.error('Failed to get order by id', { error, orderId });
      throw new Error('Failed to get order');
    }
  }

  /**
   * 查询用户订单列表
   */
  async getUserOrders(params: {
    userId: string;
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const { userId, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    try {
      const where = {
        userId,
        ...(status && { status }),
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.order.count({ where }),
      ]);

      return { orders, total };
    } catch (error) {
      logger.error('Failed to get user orders', { error, userId });
      throw new Error('Failed to get user orders');
    }
  }

  /**
   * 更新订单为已支付状态
   * 包含幂等性处理
   */
  async markOrderAsPaid(params: {
    orderNo: string;
    transactionId: string;
  }): Promise<Order> {
    const { orderNo, transactionId } = params;

    try {
      // 查询订单
      const order = await prisma.order.findUnique({
        where: { orderNo },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // 幂等性检查：如果订单已支付，直接返回
      if (order.status === OrderStatus.PAID) {
        logger.info('Order already paid (idempotent)', { orderNo, transactionId });
        return order;
      }

      // 检查订单状态是否可支付
      if (order.status !== OrderStatus.PENDING) {
        throw new Error(`Order status is ${order.status}, cannot mark as paid`);
      }

      // 更新订单状态
      const updatedOrder = await prisma.order.update({
        where: { orderNo },
        data: {
          status: OrderStatus.PAID,
          transactionId,
          paidAt: new Date(),
        },
      });

      logger.info('Order marked as paid', {
        orderId: order.id,
        orderNo,
        transactionId,
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Failed to mark order as paid', { error, orderNo, transactionId });
      throw error;
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: string): Promise<Order> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      logger.info('Order cancelled', { orderId });

      return updatedOrder;
    } catch (error) {
      logger.error('Failed to cancel order', { error, orderId });
      throw error;
    }
  }

  /**
   * 退款订单
   */
  async refundOrder(params: {
    orderId: string;
    refundReason: string;
  }): Promise<Order> {
    const { orderId, refundReason } = params;

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== OrderStatus.PAID) {
        throw new Error(`Cannot refund order with status: ${order.status}`);
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.REFUNDED,
          refundedAt: new Date(),
          refundReason,
        },
      });

      logger.info('Order refunded', { orderId, refundReason });

      return updatedOrder;
    } catch (error) {
      logger.error('Failed to refund order', { error, orderId });
      throw error;
    }
  }

  /**
   * 查询待支付订单（用于定时查询支付状态）
   */
  async getPendingOrders(olderThanMinutes: number = 5): Promise<Order[]> {
    try {
      const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

      const orders = await prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING,
          createdAt: {
            lt: cutoffTime,
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 100, // 限制每次查询数量
      });

      return orders;
    } catch (error) {
      logger.error('Failed to get pending orders', { error });
      throw new Error('Failed to get pending orders');
    }
  }
}

export const orderService = new OrderService();

