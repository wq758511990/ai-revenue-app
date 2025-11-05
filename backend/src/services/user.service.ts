/**
 * 用户服务
 * 管理用户信息和会员状态
 */

import prisma from '../config/database';
import quotaService from './quota.service';
import logger from '../utils/logger';

/**
 * 用户资料
 */
export interface UserProfile {
  id: string;
  openId: string;
  nickname?: string;
  avatarUrl?: string;
  membershipType: string;
  membershipExpireAt: Date | null;
  status: string;
  createdAt: Date;
}

/**
 * 用户详情（包含配额信息）
 */
export interface UserDetail extends UserProfile {
  quota: {
    dailyQuota: number;
    usedQuota: number;
    remainingQuota: number;
    purchasedQuota: number;
    resetAt: Date;
  };
}

/**
 * 用户服务类
 */
export class UserService {
  /**
   * 获取用户资料
   */
  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          openId: true,
          nickname: true,
          avatarUrl: true,
          membershipType: true,
          membershipExpireAt: true,
          status: true,
          createdAt: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        openId: user.openId,
        nickname: user.nickname ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined,
        membershipType: user.membershipType,
        membershipExpireAt: user.membershipExpireAt,
        status: user.status,
        createdAt: user.createdAt,
      };
    } catch (error) {
      logger.error('获取用户资料失败:', error);
      return null;
    }
  }

  /**
   * 获取用户详情（包含配额信息）
   */
  public async getUserDetail(userId: string): Promise<UserDetail | null> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        return null;
      }

      const quotaInfo = await quotaService.getQuotaInfo(userId);
      if (!quotaInfo) {
        return null;
      }

      return {
        ...profile,
        quota: {
          dailyQuota: quotaInfo.dailyQuota,
          usedQuota: quotaInfo.usedQuota,
          remainingQuota: quotaInfo.remainingQuota,
          purchasedQuota: quotaInfo.purchasedQuota,
          resetAt: quotaInfo.resetAt,
        },
      };
    } catch (error) {
      logger.error('获取用户详情失败:', error);
      return null;
    }
  }

  /**
   * 更新用户资料
   */
  public async updateUserProfile(
    userId: string,
    data: {
      nickname?: string;
      avatarUrl?: string;
    }
  ): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data,
      });

      logger.info(`用户 ${userId} 更新资料成功`);
      return true;
    } catch (error) {
      logger.error('更新用户资料失败:', error);
      return false;
    }
  }

  /**
   * 检查用户是否是会员
   */
  public async isMember(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          membershipType: true,
          membershipExpireAt: true,
        },
      });

      if (!user) {
        return false;
      }

      // 检查会员是否过期
      if (user.membershipType !== 'FREE' && user.membershipExpireAt) {
        return user.membershipExpireAt > new Date();
      }

      return false;
    } catch (error) {
      logger.error('检查会员状态失败:', error);
      return false;
    }
  }

  /**
   * 获取会员剩余天数
   */
  public async getMembershipDaysLeft(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          membershipType: true,
          membershipExpireAt: true,
        },
      });

      if (!user || user.membershipType === 'FREE' || !user.membershipExpireAt) {
        return 0;
      }

      const now = new Date();
      if (user.membershipExpireAt <= now) {
        return 0;
      }

      const diffTime = user.membershipExpireAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      logger.error('获取会员剩余天数失败:', error);
      return 0;
    }
  }

  /**
   * 获取用户统计信息
   */
  public async getUserStats(userId: string): Promise<{
    totalGenerations: number;
    totalFeedbacks: number;
    memberDays: number;
  }> {
    try {
      const [generationCount, feedbackCount, memberDays] = await Promise.all([
        // 总生成次数
        prisma.contentRecord.count({
          where: { userId },
        }),
        // 总反馈数
        prisma.feedback.count({
          where: { userId },
        }),
        // 会员剩余天数
        this.getMembershipDaysLeft(userId),
      ]);

      return {
        totalGenerations: generationCount,
        totalFeedbacks: feedbackCount,
        memberDays,
      };
    } catch (error) {
      logger.error('获取用户统计失败:', error);
      return {
        totalGenerations: 0,
        totalFeedbacks: 0,
        memberDays: 0,
      };
    }
  }

  /**
   * 创建或更新用户（用于微信登录）
   */
  public async upsertUser(data: {
    openId: string;
    unionId?: string;
    nickname?: string;
    avatarUrl?: string;
  }): Promise<string> {
    try {
      const user = await prisma.user.upsert({
        where: { openId: data.openId },
        update: {
          nickname: data.nickname,
          avatarUrl: data.avatarUrl,
          unionId: data.unionId,
          lastLoginAt: new Date(),
        },
        create: {
          openId: data.openId,
          unionId: data.unionId,
          nickname: data.nickname,
          avatarUrl: data.avatarUrl,
          membershipType: 'FREE',
          lastLoginAt: new Date(),
        },
      });

      logger.info(`用户 ${user.id} 登录成功`);
      return user.id;
    } catch (error) {
      logger.error('创建或更新用户失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const userService = new UserService();
export default userService;

