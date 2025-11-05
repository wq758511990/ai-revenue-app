import { MembershipType, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../constants/pagination.constants';
import { MEMBERSHIP_PRICING, PAY_PER_USE_UNIT_PRICE } from '../constants/pricing.constants';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import logger from '../utils/logger';
import ResponseUtil from '../utils/response';

const prisma = new PrismaClient();

/**
 * 支付控制器
 */
export class PaymentController {
  /**
   * 创建会员订单
   * POST /api/orders
   */
  async createOrder(req: Request, res: Response) {
    try {
      const { orderType, membershipType, quantity } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      // 验证参数
      if (!orderType) {
        return ResponseUtil.badRequest(res, 'Order type is required');
      }

      let order;
      let amount: number;

      if (orderType === 'MEMBERSHIP') {
        // 会员订单
        if (!membershipType || !['MONTHLY', 'YEARLY'].includes(membershipType)) {
          return ResponseUtil.badRequest(res, 'Invalid membership type');
        }

        // 使用配置中的定价
        amount = MEMBERSHIP_PRICING[membershipType as keyof typeof MEMBERSHIP_PRICING];

        order = await orderService.createMembershipOrder({
          userId,
          membershipType: membershipType as MembershipType,
          amount,
        });
      } else if (orderType === 'PAY_PER_USE') {
        // 按次购买
        if (!quantity || quantity <= 0) {
          return ResponseUtil.badRequest(res, 'Invalid quantity');
        }

        // 使用配置中的单价
        amount = quantity * PAY_PER_USE_UNIT_PRICE;

        order = await orderService.createPayPerUseOrder({
          userId,
          quantity,
          amount,
        });
      } else {
        return ResponseUtil.badRequest(res, 'Invalid order type');
      }

      // 生成微信支付参数
      const paymentParams = await paymentService.createWeChatPayment(order);

      return ResponseUtil.created(res, {
        orderId: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        paymentParams,
      }, 'Order created successfully');
    } catch (error) {
      logger.error('Failed to create order', { error, body: req.body });
      return ResponseUtil.serverError(res, 'Failed to create order');
    }
  }

  /**
   * 查询订单详情
   * GET /api/orders/:id
   */
  async getOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const order = await orderService.getOrderById(id);

      if (!order) {
        return ResponseUtil.notFound(res, 'Order not found');
      }

      // 验证订单所有者
      if (order.userId !== userId) {
        return ResponseUtil.forbidden(res);
      }

      return ResponseUtil.success(res, order);
    } catch (error) {
      logger.error('Failed to get order', { error, orderId: req.params.id });
      return ResponseUtil.serverError(res, 'Failed to get order');
    }
  }

  /**
   * 支付回调通知
   * POST /api/payment/notify
   */
  async paymentNotify(req: Request, res: Response) {
    try {
      const xmlData = req.body;

      logger.info('Received payment notify', { xmlData });

      // 处理支付回调
      const result = await paymentService.handlePaymentNotify(xmlData);

      if (result.success) {
        // 激活会员或增加配额
        const data = this.parseXml(xmlData);
        const order = await orderService.getOrderByOrderNo(data.out_trade_no);

        if (order) {
          await this.activateMembership(order);
        }

        // 返回成功响应
        res.set('Content-Type', 'text/xml');
        return res.send(paymentService.generateSuccessXml());
      } else {
        // 返回失败响应
        res.set('Content-Type', 'text/xml');
        return res.send(paymentService.generateFailXml(result.message));
      }
    } catch (error) {
      logger.error('Failed to handle payment notify', { error });
      res.set('Content-Type', 'text/xml');
      return res.send(paymentService.generateFailXml('Internal error'));
    }
  }

  /**
   * 激活会员或增加配额
   */
  private async activateMembership(order: any) {
    try {
      if (order.orderType === 'MEMBERSHIP' && order.membershipType) {
        // 激活会员
        const duration = order.membershipType === 'MONTHLY' ? 30 : 365;
        const expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + duration);

        await prisma.user.update({
          where: { id: order.userId },
          data: {
            membershipType: order.membershipType,
            membershipExpireAt: expireAt,
          },
        });

        logger.info('Membership activated', {
          userId: order.userId,
          membershipType: order.membershipType,
          expireAt,
        });
      } else if (order.orderType === 'PAY_PER_USE') {
        // 增加购买配额
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            purchasedQuota: {
              increment: order.quantity,
            },
          },
        });

        logger.info('Purchased quota added', {
          userId: order.userId,
          quantity: order.quantity,
        });
      }
    } catch (error) {
      logger.error('Failed to activate membership', { error, orderId: order.id });
      throw error;
    }
  }

  /**
   * 查询订单支付状态
   * GET /api/orders/:id/status
   */
  async queryOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const order = await orderService.getOrderById(id);

      if (!order) {
        return ResponseUtil.notFound(res, 'Order not found');
      }

      // 验证订单所有者
      if (order.userId !== userId) {
        return ResponseUtil.forbidden(res);
      }

      // 如果订单状态不是待支付，直接返回
      if (order.status !== 'PENDING') {
        return ResponseUtil.success(res, {
          status: order.status,
          paid: order.status === 'PAID',
        });
      }

      // 查询微信支付状态
      const paymentStatus = await paymentService.queryOrderStatus(order.orderNo);

      // 如果支付成功，更新订单状态
      if (paymentStatus.paid && paymentStatus.transactionId) {
        await orderService.markOrderAsPaid({
          orderNo: order.orderNo,
          transactionId: paymentStatus.transactionId,
        });

        // 激活会员
        await this.activateMembership(order);

        return ResponseUtil.success(res, {
          status: 'PAID',
          paid: true,
        });
      }

      return ResponseUtil.success(res, {
        status: order.status,
        paid: false,
      });
    } catch (error) {
      logger.error('Failed to query order status', { error, orderId: req.params.id });
      return ResponseUtil.serverError(res, 'Failed to query order status');
    }
  }

  /**
   * 获取用户订单列表
   * GET /api/orders
   */
  async getUserOrders(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const { 
        status, 
        page = String(DEFAULT_PAGE), 
        limit = String(DEFAULT_PAGE_SIZE) 
      } = req.query;

      const result = await orderService.getUserOrders({
        userId,
        status: status as any,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      return ResponseUtil.success(res, result);
    } catch (error) {
      logger.error('Failed to get user orders', { error });
      return ResponseUtil.serverError(res, 'Failed to get user orders');
    }
  }

  /**
   * 解析XML
   */
  private parseXml(xml: string): Record<string, any> {
    const obj: Record<string, any> = {};
    const regex = /<(\w+)>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/\1>/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
      obj[match[1]] = match[2];
    }

    return obj;
  }
}

export const paymentController = new PaymentController();

