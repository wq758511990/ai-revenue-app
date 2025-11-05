import { Request, Response } from 'express';
import toneStyleService from '../services/tone-style.service';
import logger from '../utils/logger';
import ResponseUtil from '../utils/response';

export class ToneStyleController {
  /**
   * GET /tone-styles
   * 获取所有情绪风格
   */
  async getAll(_req: Request, res: Response) {
    try {
      const styles = await toneStyleService.getAllStyles();
      return ResponseUtil.success(res, styles);
    } catch (error: any) {
      logger.error('获取情绪风格失败:', error);
      return ResponseUtil.serverError(res, error.message || '获取失败');
    }
  }

  /**
   * GET /tone-styles/:slug
   * 获取单个情绪风格
   */
  async getBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const style = await toneStyleService.getStyleBySlug(slug);
      return ResponseUtil.success(res, style);
    } catch (error: any) {
      logger.error('获取情绪风格失败:', error);
      return ResponseUtil.notFound(res, error.message || '未找到');
    }
  }
}

export default new ToneStyleController();

