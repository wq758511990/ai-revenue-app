/**
 * 配额检查中间件
 * 在生成文案前检查用户配额
 */

import { NextFunction, Request, Response } from 'express';
import quotaService from '../services/quota.service';
import logger from '../utils/logger';

/**
 * 配额检查中间件
 */
export async function quotaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        code: 401,
        message: '未授权访问',
      });
      return;
    }

    logger.info(`开始检查配额，用户ID: ${userId}`);

    // 检查配额
    const checkResult = await quotaService.checkQuota(userId);
    logger.info('配额检查结果:', { userId, allowed: checkResult.allowed, reason: checkResult.reason });

    if (!checkResult.allowed) {
      // 获取详细配额信息
      const quotaInfo = await quotaService.getQuotaInfo(userId);
      logger.warn(`用户 ${userId} 配额不足:`, quotaInfo);

      res.status(403).json({
        code: 403,
        message: checkResult.reason || '配额不足',
        data: {
          quotaInfo,
          needUpgrade: true,
        },
      });
      return;
    }

    logger.info(`配额检查通过，用户 ${userId} 继续处理`);
    // 配额充足，继续处理
    next();
  } catch (error) {
    logger.error('配额检查失败:', error);
    res.status(500).json({
      code: 500,
      message: '配额检查失败',
    });
  }
}

export default quotaMiddleware;

