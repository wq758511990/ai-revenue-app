/**
 * 用户控制器
 * 处理用户相关的API请求
 */

import { Request, Response } from 'express';
import userService from '../services/user.service';
import quotaService from '../services/quota.service';
import logger from '../utils/logger';
import ResponseUtil from '../utils/response';

export class UserController {
  /**
   * GET /user/profile
   * 获取用户资料
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const profile = await userService.getUserProfile(userId);
      if (!profile) {
        return ResponseUtil.notFound(res, '用户不存在');
      }

      return ResponseUtil.success(res, profile);
    } catch (error: any) {
      logger.error('获取用户资料失败:', error);
      return ResponseUtil.serverError(res, error.message || '获取用户资料失败');
    }
  }

  /**
   * GET /user/detail
   * 获取用户详情（包含配额）
   */
  async getDetail(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const detail = await userService.getUserDetail(userId);
      if (!detail) {
        return ResponseUtil.notFound(res, '用户不存在');
      }

      return ResponseUtil.success(res, detail);
    } catch (error: any) {
      logger.error('获取用户详情失败:', error);
      return ResponseUtil.serverError(res, error.message || '获取用户详情失败');
    }
  }

  /**
   * GET /user/quota
   * 获取用户配额信息
   */
  async getQuota(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const quota = await quotaService.getQuotaInfo(userId);
      if (!quota) {
        return ResponseUtil.notFound(res, '用户不存在');
      }

      return ResponseUtil.success(res, quota);
    } catch (error: any) {
      logger.error('获取配额信息失败:', error);
      return ResponseUtil.serverError(res, error.message || '获取配额信息失败');
    }
  }

  /**
   * GET /user/stats
   * 获取用户统计信息
   */
  async getStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const stats = await userService.getUserStats(userId);
      return ResponseUtil.success(res, stats);
    } catch (error: any) {
      logger.error('获取用户统计失败:', error);
      return ResponseUtil.serverError(res, error.message || '获取用户统计失败');
    }
  }

  /**
   * PUT /user/profile
   * 更新用户资料
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const { nickname, avatarUrl } = req.body;

      const success = await userService.updateUserProfile(userId, {
        nickname,
        avatarUrl,
      });

      if (!success) {
        return ResponseUtil.serverError(res, '更新失败');
      }

      return ResponseUtil.success(res, null, '更新成功');
    } catch (error: any) {
      logger.error('更新用户资料失败:', error);
      return ResponseUtil.serverError(res, error.message || '更新用户资料失败');
    }
  }
}

export default new UserController();

