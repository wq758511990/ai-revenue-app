/**
 * 文案内容服务
 * 整合AI生成、内容审核、记录保存的完整流程
 */

import { DEFAULT_PAGE_SIZE } from '../constants/pagination.constants';
import logger from '../utils/logger';
import aiService from './ai.service';
import analyticsService from './analytics.service';
import contentRecordService from './content-record.service';
import quotaService from './quota.service';
import scenarioService from './scenario.service';
import securityService from './security.service';

/**
 * 生成内容请求
 */
export interface GenerateContentRequest {
  userId: string;
  scenarioSlug: string;
  userInput: Record<string, any>;
  toneStyle?: string;
}

/**
 * 生成内容响应
 */
export interface GenerateContentResponse {
  success: boolean;
  content?: string;
  recordId?: string;
  error?: string;
  reason?: string;
}

/**
 * 内容服务类
 */
export class ContentService {
  /**
   * 封装配额回滚逻辑（DRY原则）
   * 当生成失败时，统一回滚配额并返回错误
   */
  private async handleFailureWithRefund(
    userId: string,
    error: string,
    recordGenerationStats: boolean = false,
    statsData?: {
      scenarioSlug: string;
      toneStyle: string;
      generationTime?: number;
    }
  ): Promise<GenerateContentResponse> {
    // 回滚配额
    await quotaService.refundQuota(userId);
    
    // 如果需要，记录失败统计
    if (recordGenerationStats && statsData) {
      await analyticsService.recordGeneration({
        userId,
        scenarioSlug: statsData.scenarioSlug,
        toneStyle: statsData.toneStyle,
        generationTime: statsData.generationTime || 0,
        success: false,
      });
    }
    
    return {
      success: false,
      error,
    };
  }
  /**
   * 生成文案内容（完整流程）
   */
  public async generateContent(
    request: GenerateContentRequest
  ): Promise<GenerateContentResponse> {
    const { userId, scenarioSlug, userInput, toneStyle } = request;

    try {
      // 1. 检查并扣减配额
      const quotaCheck = await quotaService.checkQuota(userId);
      if (!quotaCheck.allowed) {
        return {
          success: false,
          error: quotaCheck.reason || '配额不足',
        };
      }

      const deductResult = await quotaService.deductQuota(userId);
      if (!deductResult.success) {
        return {
          success: false,
          error: deductResult.error || '配额扣减失败',
        };
      }

      // 2. 获取场景配置（现在 service 会在找不到时抛出错误）
      const scenario = await scenarioService.getScenarioBySlug(scenarioSlug);

      // 3. 验证用户输入
      const validationError = this.validateUserInput(userInput, scenario.inputSchema);
      if (validationError) {
        return this.handleFailureWithRefund(userId, validationError);
      }

      // 3. 调用AI生成
      const finalToneStyle = toneStyle || scenario.defaultToneStyle;
      
      logger.info(`用户 ${userId} 开始生成文案 - 场景: ${scenarioSlug}, 风格: ${finalToneStyle}`);

      // 4. 调用AI生成
      const aiResult = await aiService.generateContent({
        scenarioSlug,
        toneStyleSlug: finalToneStyle,
        userInput,
        userId,
      });

      const generatedContent = aiResult.content;
      const generationTime = aiResult.generationTime;

      if (!generatedContent) {
        return this.handleFailureWithRefund(
          userId,
          'AI生成失败，请重试',
          true,
          {
            scenarioSlug,
            toneStyle: finalToneStyle,
            generationTime,
          }
        );
      }

      // 5. 内容安全审核
      const securityCheck = await securityService.checkContent(generatedContent);
      if (!securityCheck.safe) {
        logger.warn(`内容审核未通过 - 用户: ${userId}, 原因: ${securityCheck.reason}`);
        
        return this.handleFailureWithRefund(userId, '生成的内容未通过安全审核');
      }

      // 6. 保存生成记录
      const record = await contentRecordService.createRecord({
        userId,
        scenarioId: scenario.id,
        toneStyle: finalToneStyle,
        userInput,
        generatedContent,
        generationTime,
        aiModel: aiResult.model,
      });

      logger.info(`文案生成成功 - 记录ID: ${record.id}, 用户: ${userId}`);

      // 7. 记录统计数据
      await analyticsService.recordGeneration({
        userId,
        scenarioSlug,
        toneStyle: finalToneStyle,
        generationTime,
        success: true,
      });

      return {
        success: true,
        content: generatedContent,
        recordId: record.id,
      };
    } catch (error) {
      logger.error('文案生成流程失败:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成失败，请重试',
      };
    }
  }

  /**
   * 重新生成文案
   * 使用相同的场景和输入，但可以更换情绪风格
   */
  public async regenerateContent(
    recordId: string,
    userId: string,
    newToneStyle?: string
  ): Promise<GenerateContentResponse> {
    try {
      // 1. 获取原始记录
      const originalRecord = await contentRecordService.getRecordById(recordId, userId);
      if (!originalRecord) {
        return {
          success: false,
          error: '原始记录不存在',
        };
      }

      // 2. 验证权限（确保是用户自己的记录）
      if (originalRecord.userId !== userId) {
        return {
          success: false,
          error: '无权访问此记录',
        };
      }

      // 3. 获取场景信息（现在 service 会在找不到时抛出错误）
      const scenario = await scenarioService.getScenarioById(originalRecord.scenarioId);

      // 4. 使用原始输入和新的风格（或保持原风格）重新生成
      const toneStyle = newToneStyle || originalRecord.toneStyle;
      
      return await this.generateContent({
        userId,
        scenarioSlug: scenario.slug,
        userInput: originalRecord.userInput as Record<string, any>,
        toneStyle,
      });
    } catch (error) {
      logger.error('重新生成文案失败:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '重新生成失败，请重试',
      };
    }
  }

  /**
   * 验证用户输入
   */
  private validateUserInput(
    userInput: Record<string, any>,
    inputSchema: any
  ): string | null {
    if (!inputSchema || !inputSchema.fields) {
      return null;
    }

    const fields = inputSchema.fields as Array<{
      name: string;
      required?: boolean;
      type: string;
      maxLength?: number;
    }>;

    for (const field of fields) {
      const value = userInput[field.name];

      // 检查必填字段
      if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return `字段 ${field.name} 为必填项`;
      }

      // 检查字符串长度
      if (value && typeof value === 'string' && field.maxLength) {
        if (value.length > field.maxLength) {
          return `字段 ${field.name} 超出最大长度限制 ${field.maxLength}`;
        }
      }
    }

    return null;
  }

  /**
   * 获取用户的生成历史
   */
  public async getUserHistory(
    userId: string,
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE
  ) {
    try {
      return await contentRecordService.getUserRecords(userId, page, pageSize);
    } catch (error) {
      logger.error('获取用户历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容记录详情
   */
  public async getContentDetail(recordId: string, userId: string) {
    try {
      const record = await contentRecordService.getRecordById(recordId, userId);
      
      if (!record) {
        return null;
      }

      // 验证权限
      if (record.userId !== userId) {
        throw new Error('无权访问此记录');
      }

      return record;
    } catch (error) {
      logger.error('获取内容详情失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const contentService = new ContentService();
export default contentService;

