import aiProviderFactory from './ai-providers/factory';
import promptBuilder from './prompt-builder.service';
import scenarioService from './scenario.service';
import toneStyleService from './tone-style.service';
import logger from '../utils/logger';
import AIMonitor from '../utils/ai-monitor';

export interface GenerateContentRequest {
  scenarioSlug: string;
  toneStyleSlug: string;
  userInput: Record<string, any>;
  userId: string;
}

export interface GenerateContentResponse {
  content: string;
  model: string;
  provider: string;
  generationTime: number;
  tokens?: number;
}

export class AIService {
  /**
   * 生成文案内容
   */
  async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    const startTime = Date.now();

    try {
      // 1. 获取场景配置
      const scenario = await scenarioService.getScenarioBySlug(request.scenarioSlug);

      // 2. 获取情绪风格配置
      const toneStyle = await toneStyleService.getStyleBySlug(request.toneStyleSlug);

      // 3. 构建Prompt
      const messages = promptBuilder.buildPrompt(
        scenario.systemPrompt,
        toneStyle.promptModifier,
        request.userInput
      );

      logger.info('开始生成文案', {
        userId: request.userId,
        scenario: scenario.name,
        toneStyle: toneStyle.name,
      });

      // 4. 调用AI生成
      const aiResponse = await aiProviderFactory.generate({
        messages,
        temperature: 0.7,
        maxTokens: scenario.maxLength * 2, // 预留空间
      });

      const generationTime = Date.now() - startTime;

      // 5. 记录监控数据
      await AIMonitor.recordCall({
        provider: aiProviderFactory.getCurrentProviderName(),
        success: true,
        duration: generationTime,
        model: aiResponse.model,
        tokens: aiResponse.usage?.totalTokens,
        timestamp: new Date(),
      });

      logger.info('文案生成成功', {
        userId: request.userId,
        provider: aiProviderFactory.getCurrentProviderName(),
        duration: `${generationTime}ms`,
        tokens: aiResponse.usage?.totalTokens,
      });

      return {
        content: aiResponse.content,
        model: aiResponse.model,
        provider: aiProviderFactory.getCurrentProviderName(),
        generationTime,
        tokens: aiResponse.usage?.totalTokens,
      };
    } catch (error: any) {
      const generationTime = Date.now() - startTime;

      // 记录失败
      await AIMonitor.recordCall({
        provider: aiProviderFactory.getCurrentProviderName(),
        success: false,
        duration: generationTime,
        model: 'unknown',
        timestamp: new Date(),
      });

      logger.error('文案生成失败:', {
        userId: request.userId,
        error: error.message,
        duration: `${generationTime}ms`,
      });

      throw error;
    }
  }
}

export default new AIService();

