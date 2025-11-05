/**
 * 用户路由
 */

import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 所有用户接口都需要认证
router.use(authMiddleware);

// 获取用户资料
router.get('/profile', userController.getProfile.bind(userController));

// 获取用户详情（包含配额）
router.get('/detail', userController.getDetail.bind(userController));

// 获取配额信息
router.get('/quota', userController.getQuota.bind(userController));

// 获取用户统计
router.get('/stats', userController.getStats.bind(userController));

// 更新用户资料
router.put('/profile', userController.updateProfile.bind(userController));

export default router;

