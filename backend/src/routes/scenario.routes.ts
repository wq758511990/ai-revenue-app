import { Router } from 'express';
import scenarioController from '../controllers/scenario.controller';

const router: Router = Router();

// 获取所有场景
router.get('/', scenarioController.getAll.bind(scenarioController));

// 获取单个场景
router.get('/:slug', scenarioController.getBySlug.bind(scenarioController));

export default router;

