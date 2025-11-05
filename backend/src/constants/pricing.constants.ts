/**
 * 定价相关常量
 */

// 会员套餐定价
export const MEMBERSHIP_PRICING = {
  MONTHLY: 29.9,  // 月度会员
  YEARLY: 199.0,  // 年度会员
} as const;

// 按次付费单价
export const PAY_PER_USE_UNIT_PRICE = 2.0;

// 会员套餐配额
export const MEMBERSHIP_QUOTA = {
  MONTHLY: 500,   // 月度会员500次
  YEARLY: 6000,   // 年度会员6000次
} as const;

// 订单超时时间（毫秒）
export const ORDER_TIMEOUT_MS = 30 * 60 * 1000; // 30分钟

