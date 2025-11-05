/**
 * 配额管理服务
 * 管理用户的文案生成配额（Redis + MySQL双存储）
 */

import { config } from '../config';
import prisma from '../config/database';
import redisClient from '../config/redis';
import logger from '../utils/logger';

const REDIS_PREFIX = 'quota';

/**
 * 配额信息
 */
export interface QuotaInfo {
  userId: string;
  dailyQuota: number; // 每日配额
  usedQuota: number; // 已使用配额
  remainingQuota: number; // 剩余配额
  purchasedQuota: number; // 购买的额外配额
  membershipType: string; // 会员类型
  membershipExpireAt: Date | null; // 会员过期时间
  resetAt: Date; // 下次重置时间
}

/**
 * 配额管理服务类
 */
export class QuotaService {
  /**
   * 获取用户配额信息
   */
  public async getQuotaInfo(userId: string): Promise<QuotaInfo | null> {
    try {
      // 1. 从Redis获取今日使用量
      const today = this.getTodayKey();
      const redisKey = `${REDIS_PREFIX}:${userId}:${today}`;
      const usedQuotaStr = await redisClient.get(redisKey);
      const usedQuota = usedQuotaStr ? parseInt(usedQuotaStr) : 0;

      // 2. 从数据库获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          membershipType: true,
          membershipExpireAt: true,
          purchasedQuota: true,
        },
      });

      if (!user) {
        return null;
      }

      // 3. 计算每日配额
      const dailyQuota = this.getDailyQuota(user.membershipType, user.membershipExpireAt);

      // 4. 计算剩余配额（每日配额 - 已使用 + 购买配额）
      const remainingQuota = Math.max(0, dailyQuota - usedQuota) + user.purchasedQuota;

      return {
        userId,
        dailyQuota,
        usedQuota,
        remainingQuota,
        purchasedQuota: user.purchasedQuota,
        membershipType: user.membershipType,
        membershipExpireAt: user.membershipExpireAt,
        resetAt: this.getTomorrowStart(),
      };
    } catch (error) {
      logger.error('获取配额信息失败:', error);
      return null;
    }
  }

  /**
   * 检查用户是否有足够配额
   */
  public async checkQuota(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const quota = await this.getQuotaInfo(userId);

    if (!quota) {
      return { allowed: false, reason: '用户不存在' };
    }

    if (quota.remainingQuota <= 0) {
      return { allowed: false, reason: '配额不足' };
    }

    return { allowed: true };
  }

  /**
   * 扣减配额
   * 优先消耗每日免费配额，再消耗购买配额
   */
  public async deductQuota(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. 检查配额
      const quota = await this.getQuotaInfo(userId);
      if (!quota) {
        return { success: false, error: '用户不存在' };
      }

      if (quota.remainingQuota <= 0) {
        return { success: false, error: '配额不足' };
      }

      // 2. 扣减逻辑
      const today = this.getTodayKey();
      const redisKey = `${REDIS_PREFIX}:${userId}:${today}`;

      // 如果还有每日配额，扣减每日配额（Redis）
      if (quota.usedQuota < quota.dailyQuota) {
        await redisClient.incr(redisKey);
        // 设置过期时间为明天0点
        const secondsUntilTomorrow = this.getSecondsUntilTomorrow();
        await redisClient.expire(redisKey, secondsUntilTomorrow);
        
        logger.info(`扣减用户 ${userId} 每日配额，剩余: ${quota.dailyQuota - quota.usedQuota - 1}`);
      } else {
        // 扣减购买配额（MySQL）
        await prisma.user.update({
          where: { id: userId },
          data: {
            purchasedQuota: {
              decrement: 1,
            },
          },
        });
        
        logger.info(`扣减用户 ${userId} 购买配额，剩余: ${quota.purchasedQuota - 1}`);
      }

      return { success: true };
    } catch (error) {
      logger.error('扣减配额失败:', error);
      return { success: false, error: '扣减配额失败' };
    }
  }

  /**
   * 回滚配额（生成失败时）
   */
  public async refundQuota(userId: string): Promise<void> {
    try {
      const today = this.getTodayKey();
      const redisKey = `${REDIS_PREFIX}:${userId}:${today}`;
      
      // 检查今日是否有使用记录
      const usedQuotaStr = await redisClient.get(redisKey);
      if (usedQuotaStr && parseInt(usedQuotaStr) > 0) {
        // 回滚每日配额
        await redisClient.decr(redisKey);
        logger.info(`回滚用户 ${userId} 每日配额`);
      } else {
        // 回滚购买配额
        await prisma.user.update({
          where: { id: userId },
          data: {
            purchasedQuota: {
              increment: 1,
            },
          },
        });
        logger.info(`回滚用户 ${userId} 购买配额`);
      }
    } catch (error) {
      logger.error('回滚配额失败:', error);
    }
  }

  /**
   * 增加购买配额
   */
  public async addPurchasedQuota(userId: string, amount: number): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          purchasedQuota: {
            increment: amount,
          },
        },
      });
      
      logger.info(`用户 ${userId} 增加购买配额 ${amount}`);
      return true;
    } catch (error) {
      logger.error('增加购买配额失败:', error);
      return false;
    }
  }

  /**
   * 激活会员
   */
  public async activateMembership(
    userId: string,
    membershipType: string,
    durationDays: number
  ): Promise<boolean> {
    try {
      const expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + durationDays);

      await prisma.user.update({
        where: { id: userId },
        data: {
          membershipType: membershipType as any,
          membershipExpireAt: expireAt,
        },
      });

      logger.info(`用户 ${userId} 激活会员: ${membershipType}, 过期时间: ${expireAt}`);
      return true;
    } catch (error) {
      logger.error('激活会员失败:', error);
      return false;
    }
  }

  /**
   * 每日配额重置（定时任务调用）
   */
  public async resetDailyQuota(): Promise<void> {
    try {
      // Redis的每日配额会自动过期，无需手动清理
      // 这里可以记录重置日志
      logger.info('每日配额已自动重置');
    } catch (error) {
      logger.error('重置每日配额失败:', error);
    }
  }

  /**
   * 根据会员类型计算每日配额
   */
  private getDailyQuota(membershipType: string, expireAt: Date | null): number {
    // 检查会员是否过期
    if (expireAt && expireAt < new Date()) {
      return config.quota.free;
    }

    switch (membershipType) {
      case 'MONTHLY':
        return config.quota.monthly;
      case 'YEARLY':
        return config.quota.yearly;
      case 'FREE':
      default:
        return config.quota.free;
    }
  }

  /**
   * 获取今天的日期key（格式：YYYY-MM-DD）
   */
  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 获取明天0点的Date对象
   */
  private getTomorrowStart(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * 获取距离明天0点的秒数
   */
  private getSecondsUntilTomorrow(): number {
    const now = new Date();
    const tomorrow = this.getTomorrowStart();
    return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
  }

  /**
   * 获取用户配额使用统计
   */
  public async getQuotaStats(userId: string, days: number = 7): Promise<Record<string, number>> {
    try {
      const stats: Record<string, number> = {};
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        const redisKey = `${REDIS_PREFIX}:${userId}:${dateKey}`;
        const usedStr = await redisClient.get(redisKey);
        stats[dateKey] = usedStr ? parseInt(usedStr) : 0;
      }
      
      return stats;
    } catch (error) {
      logger.error('获取配额统计失败:', error);
      return {};
    }
  }
}

// 导出单例
export const quotaService = new QuotaService();
export default quotaService;

