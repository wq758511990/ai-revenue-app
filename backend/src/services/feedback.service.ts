/**
 * Feedback Service
 * 处理用户反馈的提交、查询和管理
 */

import { PrismaClient, Feedback, FeedbackType, FeedbackStatus } from '@prisma/client';
import logger from '../utils/logger';
import contentFilter from '../utils/content-filter';

const prisma = new PrismaClient();

interface CreateFeedbackInput {
  userId: string;
  feedbackType: FeedbackType;
  content: string;
}

interface UpdateFeedbackInput {
  status?: FeedbackStatus;
  adminReply?: string;
  repliedBy?: string;
  priority?: number;
}

interface FeedbackQueryOptions {
  userId?: string;
  feedbackType?: FeedbackType;
  status?: FeedbackStatus;
  page?: number;
  limit?: number;
}

class FeedbackService {
  /**
   * 创建新的用户反馈
   */
  async createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
    try {
      // 验证内容长度（5-200字）
      const contentLength = input.content.trim().length;
      if (contentLength < 5) {
        throw new Error('反馈内容至少需要5个字符');
      }
      if (contentLength > 200) {
        throw new Error('反馈内容不能超过200个字符');
      }

      // 敏感词过滤
      const sensitiveWords = contentFilter.check(input.content);
      if (sensitiveWords.length > 0) {
        throw new Error('反馈内容包含敏感词，请修改后重新提交');
      }

      // 创建反馈记录
      const feedback = await prisma.feedback.create({
        data: {
          userId: input.userId,
          feedbackType: input.feedbackType,
          content: input.content.trim(),
          status: FeedbackStatus.SUBMITTED,
        },
        include: {
          user: {
            select: {
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      });

      logger.info('Feedback created', {
        feedbackId: feedback.id,
        userId: input.userId,
        feedbackType: input.feedbackType,
      });

      return feedback;
    } catch (error) {
      logger.error('Failed to create feedback', { error, input });
      throw error;
    }
  }

  /**
   * 查询反馈列表（支持分页）
   */
  async getFeedbacks(options: FeedbackQueryOptions = {}): Promise<{
    feedbacks: Feedback[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        userId,
        feedbackType,
        status,
        page = 1,
        limit = 20,
      } = options;

      const where: any = {};
      
      if (userId) where.userId = userId;
      if (feedbackType) where.feedbackType = feedbackType;
      if (status) where.status = status;

      // 查询总数
      const total = await prisma.feedback.count({ where });

      // 分页查询
      const feedbacks = await prisma.feedback.findMany({
        where,
        orderBy: [
          { status: 'asc' }, // 优先显示未处理的
          { priority: 'desc' }, // 按优先级排序
          { createdAt: 'desc' }, // 按创建时间倒序
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      });

      return {
        feedbacks,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get feedbacks', { error, options });
      throw error;
    }
  }

  /**
   * 获取反馈详情
   */
  async getFeedbackById(feedbackId: string): Promise<Feedback | null> {
    try {
      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      });

      return feedback;
    } catch (error) {
      logger.error('Failed to get feedback by id', { error, feedbackId });
      throw error;
    }
  }

  /**
   * 更新反馈状态（管理员操作）
   */
  async updateFeedback(
    feedbackId: string,
    input: UpdateFeedbackInput
  ): Promise<Feedback> {
    try {
      const updateData: any = {
        ...input,
        updatedAt: new Date(),
      };

      // 如果添加了回复，设置回复时间
      if (input.adminReply && !input.repliedBy) {
        updateData.repliedAt = new Date();
      }

      const feedback = await prisma.feedback.update({
        where: { id: feedbackId },
        data: updateData,
        include: {
          user: {
            select: {
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      });

      logger.info('Feedback updated', {
        feedbackId,
        status: input.status,
        hasReply: !!input.adminReply,
      });

      return feedback;
    } catch (error) {
      logger.error('Failed to update feedback', { error, feedbackId, input });
      throw error;
    }
  }

  /**
   * 获取用户的反馈统计
   */
  async getUserFeedbackStats(userId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      const feedbacks = await prisma.feedback.findMany({
        where: { userId },
        select: {
          feedbackType: true,
          status: true,
        },
      });

      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};

      feedbacks.forEach((feedback) => {
        // 按类型统计
        byType[feedback.feedbackType] = (byType[feedback.feedbackType] || 0) + 1;
        // 按状态统计
        byStatus[feedback.status] = (byStatus[feedback.status] || 0) + 1;
      });

      return {
        total: feedbacks.length,
        byType,
        byStatus,
      };
    } catch (error) {
      logger.error('Failed to get user feedback stats', { error, userId });
      throw error;
    }
  }

  /**
   * 检查用户是否在短时间内重复提交相同内容
   */
  async checkDuplicateFeedback(
    userId: string,
    content: string,
    minutes: number = 10
  ): Promise<boolean> {
    try {
      const recentTime = new Date(Date.now() - minutes * 60 * 1000);
      
      const recentFeedback = await prisma.feedback.findFirst({
        where: {
          userId,
          content,
          createdAt: {
            gte: recentTime,
          },
        },
      });

      return !!recentFeedback;
    } catch (error) {
      logger.error('Failed to check duplicate feedback', { error, userId });
      return false; // 检查失败时不阻止提交
    }
  }
}

export const feedbackService = new FeedbackService();

