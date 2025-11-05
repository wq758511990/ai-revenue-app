import { Router } from 'express';
import toneStyleController from '../controllers/tone-style.controller';

const router = Router();

// 获取所有情绪风格
router.get('/', toneStyleController.getAll.bind(toneStyleController));

// 获取单个情绪风格
router.get('/:slug', toneStyleController.getBySlug.bind(toneStyleController));

export default router;

