import { Request, Response } from 'express';
import authService from '../services/auth.service';
import logger from '../utils/logger';
import ResponseUtil from '../utils/response';
import { validateRequired } from '../utils/validator';

export class AuthController {
  /**
   * POST /auth/login
   * 微信登录
   */
  async login(req: Request, res: Response) {
    try {
      const { code } = req.body;

      // 验证参数
      validateRequired(code, 'code');

      // 执行登录
      const result = await authService.wechatLogin(code);
      return ResponseUtil.success(res, result, '登录成功');
    } catch (error: any) {
      logger.error('登录失败:', error);
      return ResponseUtil.badRequest(res, error.message || '登录失败');
    }
  }

  /**
   * PUT /auth/profile
   * 更新用户资料
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const { nickname, avatarUrl } = req.body;

      const user = await authService.updateUserProfile(userId, {
        nickname,
        avatarUrl,
      });

      return ResponseUtil.success(res, user, '更新成功');
    } catch (error: any) {
      logger.error('更新用户资料失败:', error);
      return ResponseUtil.badRequest(res, error.message || '更新失败');
    }
  }
}

export default new AuthController();

