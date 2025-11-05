/**
 * Feedback Routes
 * 用户反馈相关的路由配置
 */

import { Router } from 'express';
import {
    getFeedbackDetail,
    getFeedbackStats,
    getUserFeedbacks,
    submitFeedback,
    updateFeedback,
} from '../controllers/feedback.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 所有反馈接口都需要认证
router.use(authMiddleware);

// 提交反馈
router.post('/', submitFeedback);

// 获取反馈统计（必须在 /:id 之前）
router.get('/stats', getFeedbackStats);

// 获取用户的反馈列表
router.get('/', getUserFeedbacks);

// 获取反馈详情
router.get('/:id', getFeedbackDetail);

// 更新反馈（管理员功能）
router.put('/:id', updateFeedback);

export default router;

