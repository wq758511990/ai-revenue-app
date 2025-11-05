import request from '@/utils/request';

/**
 * 支付相关API
 */

/**
 * 创建订单
 */
export const createOrder = (params: {
  orderType: 'MEMBERSHIP' | 'PAY_PER_USE';
  membershipType?: 'MONTHLY' | 'YEARLY';
  quantity?: number;
}) => {
  return request.post('/orders', params);
};

/**
 * 获取订单详情
 */
export const getOrder = (orderId: string) => {
  return request.get(`/orders/${orderId}`);
};

/**
 * 查询订单支付状态
 */
export const getOrderStatus = (orderId: string) => {
  return request.get(`/orders/${orderId}/status`);
};

/**
 * 获取用户订单列表
 */
export const getUserOrders = (params?: {
  status?: 'PENDING' | 'PAID' | 'REFUNDED' | 'CANCELLED';
  page?: number;
  limit?: number;
}) => {
  return request.get('/orders', { params });
};

