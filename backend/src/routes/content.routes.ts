import { Router } from 'express';
import contentController from '../controllers/content.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { quotaMiddleware } from '../middleware/quota.middleware';

const router = Router();

// 所有内容相关接口都需要认证
router.use(authMiddleware);

// 生成文案（需要配额检查）
router.post('/generate', quotaMiddleware, contentController.generate.bind(contentController));

// 重新生成文案（需要配额检查）
router.post('/:id/regenerate', quotaMiddleware, contentController.regenerate.bind(contentController));

// 获取历史记录
router.get('/history', contentController.getHistory.bind(contentController));

// 获取用户统计
router.get('/stats', contentController.getUserStats.bind(contentController));

// 获取"再次使用"数据
router.get('/:id/reuse', contentController.getReuseData.bind(contentController));

// 获取单条记录
router.get('/:id', contentController.getById.bind(contentController));

// 编辑文案
router.put('/:id/edit', contentController.editContent.bind(contentController));

export default router;

