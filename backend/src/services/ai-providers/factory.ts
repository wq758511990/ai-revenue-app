import { config } from '../../config';
import { AIGenerateRequest, AIGenerateResponse, AIProvider } from '../../types/ai-provider';
import logger from '../../utils/logger';
import { DeepSeekProvider } from './deepseek.provider';
import { GroqProvider } from './groq.provider';
import { SiliconFlowProvider } from './siliconflow.provider';

export class AIProviderFactory {
  private providers: AIProvider[] = [];
  private primaryProvider: AIProvider;
  private currentProviderIndex = 0;

  constructor() {
    this.initializeProviders();
    this.primaryProvider = this.providers[0];
  }

  private initializeProviders() {
    // 检查API Key是否有效（不是占位符）
    const isValidApiKey = (key: string) => {
      return key && key.length > 10 && !key.includes('你的') && !key.includes('your');
    };

    // 初始化主provider
    if (config.ai.primaryProvider === 'deepseek' && isValidApiKey(config.ai.deepseek.apiKey)) {
      this.providers.push(
        new DeepSeekProvider({
          name: 'DeepSeek',
          apiKey: config.ai.deepseek.apiKey,
          apiUrl: config.ai.deepseek.apiUrl,
          model: config.ai.deepseek.model,
          timeout: config.ai.timeout,
        })
      );
      logger.info('✓ DeepSeek Provider 已初始化');
    }

    // 初始化备用providers
    const fallbackProviders = config.ai.fallbackProviders;

    if (fallbackProviders.includes('siliconflow') && isValidApiKey(config.ai.siliconflow.apiKey)) {
      this.providers.push(
        new SiliconFlowProvider({
          name: 'SiliconFlow',
          apiKey: config.ai.siliconflow.apiKey,
          apiUrl: config.ai.siliconflow.apiUrl,
          model: config.ai.siliconflow.model,
          timeout: config.ai.timeout,
        })
      );
      logger.info('✓ SiliconFlow Provider 已初始化');
    }

    if (fallbackProviders.includes('groq') && isValidApiKey(config.ai.groq.apiKey)) {
      this.providers.push(
        new GroqProvider({
          name: 'Groq',
          apiKey: config.ai.groq.apiKey,
          apiUrl: config.ai.groq.apiUrl,
          model: config.ai.groq.model,
          timeout: config.ai.timeout,
        })
      );
      logger.info('✓ Groq Provider 已初始化');
    }

    if (this.providers.length === 0) {
      throw new Error('没有可用的AI Provider配置，请检查.env文件中的API Key');
    }

    logger.info(`已初始化 ${this.providers.length} 个AI Provider`, {
      providers: this.providers.map(p => p.name),
    });
  }

  /**
   * 生成文案 - 自动降级策略
   */
  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    let lastError: Error | null = null;

    // 尝试所有provider
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];

      try {
        logger.info(`尝试使用 ${provider.name} 生成文案...`);
        const response = await provider.generate(request);

        // 成功后记录当前provider
        this.currentProviderIndex = i;
        return response;
      } catch (error: any) {
        lastError = error;
        logger.warn(`${provider.name} 调用失败，尝试下一个provider`, {
          error: error.message,
        });

        // 如果还有备用provider，继续尝试
        if (i < this.providers.length - 1) {
          continue;
        }
      }
    }

    // 所有provider都失败
    throw new Error(`所有AI Provider调用失败: ${lastError?.message || '未知错误'}`);
  }

  /**
   * 获取当前使用的provider名称
   */
  getCurrentProviderName(): string {
    return this.providers[this.currentProviderIndex]?.name || 'Unknown';
  }

  /**
   * 检查所有provider的可用性
   */
  async checkAvailability(): Promise<Record<string, boolean>> {
    const availability: Record<string, boolean> = {};

    await Promise.all(
      this.providers.map(async provider => {
        availability[provider.name] = await provider.isAvailable();
      })
    );

    return availability;
  }
}

// 导出单例
export default new AIProviderFactory();

