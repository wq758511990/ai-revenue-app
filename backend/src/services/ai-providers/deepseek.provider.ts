import axios, { AxiosInstance } from 'axios';
import {
  AIProvider,
  AIGenerateRequest,
  AIGenerateResponse,
  AIProviderConfig,
} from '../../types/ai-provider';
import logger from '../../utils/logger';

export class DeepSeekProvider implements AIProvider {
  public readonly name = 'DeepSeek';
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
      timeout: config.timeout || 60000, // 增加到60秒
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
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

      logger.info(`DeepSeek API调用成功`, {
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
      logger.error('DeepSeek API调用失败:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(`DeepSeek API调用失败: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // 发送简单的测试请求
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

