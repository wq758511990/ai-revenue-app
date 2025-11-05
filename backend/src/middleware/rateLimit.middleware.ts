/**
 * 频率限制中间件
 * 防止API滥用和DDoS攻击
 */

import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import redisClient from '../config/redis';
import logger from '../utils/logger';

/**
 * 通用API频率限制
 * 每个IP每分钟最多60次请求
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 60, // 最多60次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 使用IP作为key
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`IP ${req.ip} 触发频率限制 - ${req.path}`);
    res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * 登录API频率限制
 * 每个IP每15分钟最多5次登录尝试
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    success: false,
    message: '登录尝试过于频繁，请15分钟后再试',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
  },
  skipSuccessfulRequests: true, // 成功的请求不计入限制
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`IP ${req.ip} 登录频率限制 - 连续失败次数过多`);
    res.status(429).json({
      success: false,
      message: '登录尝试过于频繁，请15分钟后再试',
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * AI生成API频率限制
 * 每个用户每分钟最多10次生成请求
 */
export const aiGenerateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次请求
  message: {
    success: false,
    message: '生成请求过于频繁，请稍后再试',
    code: 'GENERATE_RATE_LIMIT_EXCEEDED',
  },
  // 使用用户ID作为key（需要在认证后使用）
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    logger.warn(`用户 ${userId} AI生成频率限制`);
    res.status(429).json({
      success: false,
      message: '生成请求过于频繁，请稍后再试',
      code: 'GENERATE_RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * 支付API频率限制
 * 每个用户每分钟最多3次支付请求
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 3, // 最多3次请求
  message: {
    success: false,
    message: '支付请求过于频繁，请稍后再试',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
  },
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `payment:${userId}` : req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    logger.warn(`用户 ${userId} 支付频率限制`);
    res.status(429).json({
      success: false,
      message: '支付请求过于频繁，请稍后再试',
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * 反馈提交频率限制
 * 每个用户每小时最多5次反馈
 */
export const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最多5次反馈
  message: {
    success: false,
    message: '反馈提交过于频繁，请稍后再试',
    code: 'FEEDBACK_RATE_LIMIT_EXCEEDED',
  },
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `feedback:${userId}` : req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    logger.warn(`用户 ${userId} 反馈频率限制`);
    res.status(429).json({
      success: false,
      message: '反馈提交过于频繁，请1小时后再试',
      code: 'FEEDBACK_RATE_LIMIT_EXCEEDED',
    });
  },
});

/**
 * 创建自定义频率限制中间件
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix?: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      message: options.message,
      code: 'RATE_LIMIT_EXCEEDED',
    },
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id;
      const baseKey = userId || req.ip || 'unknown';
      return options.keyPrefix ? `${options.keyPrefix}:${baseKey}` : baseKey;
    },
  });
}

/**
 * 基于Redis的滑动窗口频率限制（更精确）
 */
export async function slidingWindowRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `sliding_window:${key}`;

  try {
    // 移除窗口外的记录
    await redisClient.zremrangebyscore(redisKey, 0, windowStart);

    // 获取当前窗口内的请求数
    const currentCount = await redisClient.zcard(redisKey);

    if (currentCount >= maxRequests) {
      // 获取最早的请求时间
      const oldestTimestamp = await redisClient.zrange(redisKey, 0, 0);
      const resetTime = oldestTimestamp.length > 0 
        ? parseInt(oldestTimestamp[0]) + windowMs 
        : now + windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    // 添加当前请求
    await redisClient.zadd(redisKey, now, `${now}`);
    await redisClient.expire(redisKey, Math.ceil(windowMs / 1000));

    return {
      allowed: true,
      remaining: maxRequests - currentCount - 1,
      resetTime: now + windowMs,
    };
  } catch (error) {
    logger.error('滑动窗口频率限制错误:', error);
    // 出错时允许请求通过
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: now + windowMs,
    };
  }
}

export default {
  generalLimiter,
  loginLimiter,
  aiGenerateLimiter,
  paymentLimiter,
  feedbackLimiter,
  createRateLimiter,
  slidingWindowRateLimit,
};

