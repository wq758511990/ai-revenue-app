import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * 支付相关路由
 */

// 创建订单（需要认证）
router.post('/orders', authMiddleware, (req, res) => paymentController.createOrder(req, res));

// 查询订单详情（需要认证）
router.get('/orders/:id', authMiddleware, (req, res) => paymentController.getOrder(req, res));

// 查询订单支付状态（需要认证）
router.get('/orders/:id/status', authMiddleware, (req, res) => paymentController.queryOrderStatus(req, res));

// 获取用户订单列表（需要认证）
router.get('/orders', authMiddleware, (req, res) => paymentController.getUserOrders(req, res));

// 支付回调通知（不需要认证，微信服务器回调）
router.post('/payment/notify', (req, res) => paymentController.paymentNotify(req, res));

export default router;

