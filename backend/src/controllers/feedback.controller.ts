/**
 * Feedback Controller
 * 处理用户反馈相关的API请求
 */

import { FeedbackStatus, FeedbackType } from '@prisma/client';
import { Request, Response } from 'express';
import { feedbackService } from '../services/feedback.service';
import logger from '../utils/logger';
import ResponseUtil from '../utils/response';

/**
 * 提交用户反馈
 * POST /api/feedback
 */
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return ResponseUtil.unauthorized(res);
    }

    const { feedbackType, content } = req.body;

    // 参数验证
    if (!feedbackType || !content) {
      return ResponseUtil.badRequest(res, '反馈类型和内容不能为空');
    }

    // 验证反馈类型
    if (!Object.values(FeedbackType).includes(feedbackType)) {
      return ResponseUtil.badRequest(res, '无效的反馈类型');
    }

    // 检查是否重复提交
    const isDuplicate = await feedbackService.checkDuplicateFeedback(
      userId,
      content.trim(),
      10 // 10分钟内不能重复提交相同内容
    );

    if (isDuplicate) {
      return ResponseUtil.badRequest(res, '您刚刚已经提交过相同的反馈，请勿重复提交');
    }

    // 创建反馈
    const feedback = await feedbackService.createFeedback({
      userId,
      feedbackType,
      content: content.trim(),
    });

    ResponseUtil.created(res, feedback, '反馈提交成功');
  } catch (error: any) {
    logger.error('Submit feedback error', { error, body: req.body });
    ResponseUtil.serverError(res, error.message || '提交反馈失败，请稍后重试');
  }
};

/**
 * 获取用户的反馈列表
 * GET /api/feedback
 */
export const getUserFeedbacks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return ResponseUtil.unauthorized(res);
    }

    const {
      feedbackType,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    // 过滤掉无效的枚举值
    const queryOptions: any = {
      userId,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    // 只有当值有效时才添加到查询条件
    if (feedbackType && feedbackType !== 'undefined' && feedbackType !== 'null') {
      queryOptions.feedbackType = feedbackType as FeedbackType;
    }
    if (status && status !== 'undefined' && status !== 'null') {
      queryOptions.status = status as FeedbackStatus;
    }

    const result = await feedbackService.getFeedbacks(queryOptions);

    ResponseUtil.success(res, result);
  } catch (error) {
    logger.error('Get user feedbacks error', { error, query: req.query });
    ResponseUtil.serverError(res, '获取反馈列表失败');
  }
};

/**
 * 获取反馈详情
 * GET /api/feedback/:id
 */
export const getFeedbackDetail = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return ResponseUtil.unauthorized(res);
    }

    const { id } = req.params;

    const feedback = await feedbackService.getFeedbackById(id);

    if (!feedback) {
      return ResponseUtil.notFound(res, '反馈不存在');
    }

    // 验证权限：只能查看自己的反馈
    if (feedback.userId !== userId) {
      return ResponseUtil.forbidden(res, '无权访问此反馈');
    }

    ResponseUtil.success(res, feedback);
  } catch (error) {
    logger.error('Get feedback detail error', { error, params: req.params });
    ResponseUtil.serverError(res, '获取反馈详情失败');
  }
};

/**
 * 获取用户反馈统计
 * GET /api/feedback/stats
 */
export const getFeedbackStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return ResponseUtil.unauthorized(res);
    }

    const stats = await feedbackService.getUserFeedbackStats(userId);

    ResponseUtil.success(res, stats);
  } catch (error) {
    logger.error('Get feedback stats error', { error });
    ResponseUtil.serverError(res, '获取反馈统计失败');
  }
};

/**
 * 更新反馈（管理员功能，暂不实现完整的管理员权限）
 * PUT /api/feedback/:id
 */
export const updateFeedback = async (req: Request, res: Response) => {
  try {
    // TODO: 添加管理员权限验证
    const { id } = req.params;
    const { status, adminReply, repliedBy, priority } = req.body;

    const feedback = await feedbackService.updateFeedback(id, {
      status,
      adminReply,
      repliedBy,
      priority,
    });

    ResponseUtil.success(res, feedback, '反馈更新成功');
  } catch (error) {
    logger.error('Update feedback error', { error, params: req.params, body: req.body });
    ResponseUtil.serverError(res, '更新反馈失败');
  }
};

