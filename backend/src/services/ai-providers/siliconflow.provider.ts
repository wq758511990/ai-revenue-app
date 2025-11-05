import axios, { AxiosInstance } from 'axios';
import {
  AIProvider,
  AIGenerateRequest,
  AIGenerateResponse,
  AIProviderConfig,
} from '../../types/ai-provider';
import logger from '../../utils/logger';

export class SiliconFlowProvider implements AIProvider {
  public readonly name = 'SiliconFlow';
  private client: AxiosInstance;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      timeout: config.timeout || 30000,
    });
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    try {
      const startTime = Date.now();

      const response = await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
        stream: false,
      });

      const duration = Date.now() - startTime;

      logger.info(`SiliconFlow API调用成功`, {
        model: this.config.model,
        duration: `${duration}ms`,
        tokens: response.data.usage?.total_tokens,
      });

      return {
        content: response.data.choices[0].message.content,
        model: response.data.model,
        usage: {
          promptTokens: response.data.usage?.prompt_tokens || 0,
          completionTokens: response.data.usage?.completion_tokens || 0,
          totalTokens: response.data.usage?.total_tokens || 0,
        },
        finishReason: response.data.choices[0].finish_reason,
      };
    } catch (error: any) {
      logger.error('SiliconFlow API调用失败:', {
        error: error.message,
        status: error.response?.status,
      });
      throw new Error(`SiliconFlow API调用失败: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }
}

