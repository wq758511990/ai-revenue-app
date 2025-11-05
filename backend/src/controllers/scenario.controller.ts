import { Request, Response } from 'express';
import scenarioService from '../services/scenario.service';
import logger from '../utils/logger';
import ResponseUtil from '../utils/response';

export class ScenarioController {
  /**
   * GET /scenarios
   * 获取所有场景
   */
  async getAll(_req: Request, res: Response) {
    try {
      const scenarios = await scenarioService.getAllScenarios();
      return ResponseUtil.success(res, scenarios);
    } catch (error: any) {
      logger.error('获取场景列表失败:', error);
      return ResponseUtil.serverError(res, error.message || '获取失败');
    }
  }

  /**
   * GET /scenarios/:slug
   * 获取单个场景详情
   */
  async getBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const scenario = await scenarioService.getScenarioBySlug(slug);
      return ResponseUtil.success(res, scenario);
    } catch (error: any) {
      logger.error('获取场景详情失败:', error);
      return ResponseUtil.notFound(res, error.message || '场景不存在');
    }
  }
}

export default new ScenarioController();

