/**
 * 图片识别服务
 * 使用 SiliconFlow 的 Qwen2.5-VL 模型进行图片识别
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { MAX_IMAGES_COUNT, MAX_IMAGE_SIZE_MB } from '../constants/image.constants';
import logger from '../utils/logger';

export interface ImageRecognitionRequest {
  imageBase64: string;
  prompt?: string; // 可选的引导性问题
}

export interface ImageRecognitionResponse {
  description: string; // 图片描述
  model: string;
  success: boolean;
  error?: string;
}

export interface BatchImageRecognitionRequest {
  images: string[]; // base64 数组
  prompt?: string;
}

export interface BatchImageRecognitionResponse {
  combinedDescription: string; // 合并后的描述
  individualDescriptions: string[]; // 每张图片的描述
  model: string;
  success: boolean;
  error?: string;
}

export class ImageRecognitionService {
  private client: AxiosInstance;
  private visionModel: string;

  constructor() {
    // 使用 SiliconFlow 的配置和视觉模型
    this.client = axios.create({
      baseURL: config.ai.siliconflow.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.ai.siliconflow.apiKey}`,
      },
      timeout: 60000, // 图片处理需要更长时间
    });

    // 使用 Qwen2.5-VL-32B-Instruct 视觉模型
    this.visionModel = config.ai.siliconflow.visionModel || 'Qwen/Qwen2.5-VL-32B-Instruct';
  }

  /**
   * 验证图片数组
   */
  validateImages(images: string[]): { valid: boolean; error?: string } {
    // 检查图片数量
    if (!images || images.length === 0) {
      return { valid: false, error: '请至少上传一张图片' };
    }

    if (images.length > MAX_IMAGES_COUNT) {
      return { valid: false, error: `最多只能上传${MAX_IMAGES_COUNT}张图片` };
    }

    // 检查每张图片
    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      // 验证格式
      if (!this.validateImageBase64(image)) {
        return { valid: false, error: `第${i + 1}张图片格式不正确` };
      }

      // 验证大小
      const sizeKB = this.getImageSize(image);
      if (sizeKB > MAX_IMAGE_SIZE_MB * 1024) {
        return { valid: false, error: `第${i + 1}张图片大小超过${MAX_IMAGE_SIZE_MB}MB限制` };
      }
    }

    return { valid: true };
  }

  /**
   * 批量识别多张图片
   */
  async recognizeImages(request: BatchImageRecognitionRequest): Promise<BatchImageRecognitionResponse> {
    try {
      // 验证图片
      const validation = this.validateImages(request.images);
      if (!validation.valid) {
        return {
          combinedDescription: '',
          individualDescriptions: [],
          model: this.visionModel,
          success: false,
          error: validation.error,
        };
      }

      const startTime = Date.now();
      const individualDescriptions: string[] = [];

      logger.info('开始批量图片识别', {
        model: this.visionModel,
        imageCount: request.images.length,
      });

      // 逐个识别图片
      for (let i = 0; i < request.images.length; i++) {
        const result = await this.recognizeImage({
          imageBase64: request.images[i],
          prompt: request.prompt,
        });

        if (!result.success) {
          return {
            combinedDescription: '',
            individualDescriptions: [],
            model: this.visionModel,
            success: false,
            error: `第${i + 1}张图片识别失败`,
          };
        }

        individualDescriptions.push(result.description);
      }

      // 合并所有描述
      const combinedDescription = this.combineDescriptions(individualDescriptions);

      const duration = Date.now() - startTime;

      logger.info('批量图片识别成功', {
        model: this.visionModel,
        duration: `${duration}ms`,
        imageCount: request.images.length,
      });

      return {
        combinedDescription,
        individualDescriptions,
        model: this.visionModel,
        success: true,
      };
    } catch (error: any) {
      logger.error('批量图片识别失败:', {
        error: error.message,
      });

      return {
        combinedDescription: '',
        individualDescriptions: [],
        model: this.visionModel,
        success: false,
        error: error.message || '批量识别失败',
      };
    }
  }

  /**
   * 识别单张图片
   */
  async recognizeImage(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse> {
    try {
      const startTime = Date.now();

      // 构建默认 prompt
      const defaultPrompt = '请详细描述这张图片的内容，包括：主要物体、场景、氛围、色彩等。用简洁专业的语言描述，不超过200字。';
      const prompt = request.prompt || defaultPrompt;

      // 构建多模态消息
      const response = await this.client.post('/chat/completions', {
        model: this.visionModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: request.imageBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        temperature: 0.3, // 降低温度以获得更准确的描述
        max_tokens: 500,
      });

      const duration = Date.now() - startTime;

      const description = response.data.choices[0].message.content;

      logger.info('图片识别成功', {
        model: this.visionModel,
        duration: `${duration}ms`,
        tokens: response.data.usage?.total_tokens,
        descriptionLength: description.length,
      });

      return {
        description,
        model: this.visionModel,
        success: true,
      };
    } catch (error: any) {
      logger.error('图片识别失败:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      return {
        description: '',
        model: this.visionModel,
        success: false,
        error: error.message || '识别失败',
      };
    }
  }

  /**
   * 合并多个图片描述
   */
  private combineDescriptions(descriptions: string[]): string {
    if (descriptions.length === 1) {
      return descriptions[0];
    }

    // 如果有多张图片，以序号方式组合
    return descriptions
      .map((desc, index) => `图片${index + 1}：${desc}`)
      .join('\n\n');
  }

  /**
   * 验证图片 base64 格式
   */
  validateImageBase64(imageBase64: string): boolean {
    // 检查是否是 data:image 格式（支持 jpg、png、gif、webp）
    const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
    return base64Pattern.test(imageBase64);
  }

  /**
   * 获取图片大小（KB）
   */
  getImageSize(imageBase64: string): number {
    // base64 编码后的大小约为原始大小的 4/3
    const base64Length = imageBase64.split(',')[1]?.length || 0;
    return Math.round((base64Length * 3) / 4 / 1024);
  }
}

export default new ImageRecognitionService();

