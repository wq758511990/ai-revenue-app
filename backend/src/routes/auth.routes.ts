import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router: Router = Router();

// 登录
router.post('/login', authController.login.bind(authController));

// 更新用户资料（需要认证）
router.put('/profile', authMiddleware, authController.updateProfile.bind(authController));

export default router;

