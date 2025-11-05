/**
 * AI Provider接口定义
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIGenerateRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIGenerateResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface AIProviderConfig {
  name: string;
  apiKey: string;
  apiUrl: string;
  model: string;
  timeout?: number;
}

export interface AIProvider {
  name: string;
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;
  isAvailable(): Promise<boolean>;
}

export type AIProviderType = 'deepseek' | 'siliconflow' | 'groq';

