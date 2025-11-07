import { Request, Response } from 'express';
import contentService from '../services/content.service';
import contentRecordService from '../services/content-record.service';
import logger from '../utils/logger';
import { validateRequired } from '../utils/validator';
import ResponseUtil from '../utils/response';
import { DEFAULT_PAGE_SIZE } from '../constants/pagination.constants';

export class ContentController {
  /**
   * POST /content/generate
   * 生成文案（支持图片上传）
   */
  async generate(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const { scenarioSlug, toneStyle, userInput, images } = req.body;

      // 验证必填参数
      validateRequired(scenarioSlug, 'scenarioSlug');
      validateRequired(userInput, 'userInput');

      // 验证图片数组（如果有）
      if (images && !Array.isArray(images)) {
        return ResponseUtil.badRequest(res, '图片格式不正确');
      }

      // 调用内容服务生成文案（包含图片识别和审核流程）
      const result = await contentService.generateContent({
        userId,
        scenarioSlug,
        userInput,
        toneStyle,
        images: images || undefined,
      });

      if (!result.success) {
        return ResponseUtil.badRequest(res, result.error || '生成失败');
      }

      return ResponseUtil.success(res, {
        id: result.recordId,
        content: result.content,
      }, '生成成功');
    } catch (error: any) {
      logger.error('生成文案失败:', error);
      return ResponseUtil.serverError(res, error.message || '生成失败');
    }
  }

  /**
   * POST /content/:id/regenerate
   * 重新生成文案
   */
  async regenerate(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const { id } = req.params;
      const { toneStyle } = req.body;

      // 调用重新生成服务
      const result = await contentService.regenerateContent(id, userId, toneStyle);

      if (!result.success) {
        return ResponseUtil.badRequest(res, result.error || '重新生成失败');
      }

      return ResponseUtil.success(res, {
        id: result.recordId,
        content: result.content,
      }, '重新生成成功');
    } catch (error: any) {
      logger.error('重新生成文案失败:', error);
      return ResponseUtil.serverError(res, error.message || '重新生成失败');
    }
  }

  /**
   * GET /content/history
   * 获取历史记录
   */
  async getHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE;

      const result = await contentRecordService.getUserRecords(userId, page, pageSize);
      return ResponseUtil.success(res, result);
    } catch (error: any) {
      logger.error('获取历史记录失败:', error);
      return ResponseUtil.serverError(res, error.message || '获取失败');
    }
  }

  /**
   * GET /content/:id
   * 获取单条记录详情
   */
  async getById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const { id } = req.params;
      const record = await contentRecordService.getRecordById(id, userId);
      return ResponseUtil.success(res, record);
    } catch (error: any) {
      logger.error('获取记录详情失败:', error);
      return ResponseUtil.notFound(res, error.message || '记录不存在');
    }
  }

  /**
   * PUT /content/:id/edit
   * 编辑文案
   */
  async editContent(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const { id } = req.params;
      const { editedContent } = req.body;

      validateRequired(editedContent, 'editedContent');

      const record = await contentRecordService.editContent(id, userId, editedContent);
      return ResponseUtil.success(res, record, '编辑成功');
    } catch (error: any) {
      logger.error('编辑文案失败:', error);
      return ResponseUtil.badRequest(res, error.message || '编辑失败');
    }
  }

  /**
   * GET /content/:id/reuse
   * 获取"再次使用"所需的数据
   */
  async getReuseData(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const { id } = req.params;
      const reuseData = await contentRecordService.getReuseData(id, userId);
      return ResponseUtil.success(res, reuseData);
    } catch (error: any) {
      logger.error('获取再次使用数据失败:', error);
      return ResponseUtil.notFound(res, error.message || '记录不存在');
    }
  }

  /**
   * GET /content/stats
   * 获取用户历史统计
   */
  async getUserStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ResponseUtil.unauthorized(res);
      }

      const stats = await contentRecordService.getUserStats(userId);
      return ResponseUtil.success(res, stats);
    } catch (error: any) {
      logger.error('获取用户统计失败:', error);
      return ResponseUtil.serverError(res, error.message || '获取统计失败');
    }
  }
}

export default new ContentController();

