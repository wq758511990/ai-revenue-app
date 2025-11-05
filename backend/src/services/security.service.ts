/**
 * 内容安全服务
 * 集成微信内容安全API进行内容审核
 */

import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';
import contentFilter from '../utils/content-filter';

/**
 * 微信内容安全检测结果
 */
interface WeChatSecurityCheckResult {
  errcode: number;
  errmsg: string;
  result?: {
    suggest: 'pass' | 'review' | 'risky';
    label: number;
  };
  detail?: Array<{
    strategy: string;
    errcode: number;
    suggest: string;
    label: number;
    keyword?: string;
    prob?: number;
  }>;
  trace_id?: string;
}

/**
 * 内容审核结果
 */
export interface SecurityCheckResult {
  safe: boolean;
  reason?: string;
  keywords?: string[];
  suggest: 'pass' | 'review' | 'risky';
}

/**
 * 内容安全服务类
 */
export class SecurityService {
  private accessToken: string | null = null;
  private accessTokenExpireAt: number = 0;

  /**
   * 获取微信Access Token
   */
  private async getAccessToken(): Promise<string> {
    // 如果token还有效，直接返回
    if (this.accessToken && Date.now() < this.accessTokenExpireAt) {
      return this.accessToken;
    }

    try {
      const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
        params: {
          grant_type: 'client_credential',
          appid: config.wechat.appId,
          secret: config.wechat.appSecret,
        },
      });

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`获取Access Token失败: ${response.data.errmsg}`);
      }

      this.accessToken = response.data.access_token;
      // 提前5分钟过期，避免边界问题
      this.accessTokenExpireAt = Date.now() + (response.data.expires_in - 300) * 1000;

      logger.info('微信Access Token已更新');
      return this.accessToken!;
    } catch (error) {
      logger.error('获取微信Access Token失败:', error);
      throw error;
    }
  }

  /**
   * 调用微信内容安全API检测文本
   */
  private async checkWithWechat(text: string): Promise<WeChatSecurityCheckResult> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios.post(
        `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`,
        {
          version: 2,
          openid: 'system_check', // 系统检测，使用固定openid
          scene: 2, // 场景值：2-文案生成
          content: text,
        },
        {
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('微信内容安全检测失败:', error);
      throw error;
    }
  }

  /**
   * 综合内容安全检测
   * 1. 先使用本地敏感词过滤
   * 2. 如果本地检测通过，再调用微信API二次检测
   */
  public async checkContent(text: string): Promise<SecurityCheckResult> {
    if (!text || text.trim().length === 0) {
      return {
        safe: true,
        suggest: 'pass',
      };
    }

    // 第一步：本地敏感词过滤
    const localKeywords = contentFilter.check(text);
    if (localKeywords.length > 0) {
      logger.warn(`内容包含敏感词: ${localKeywords.join(', ')}`);
      return {
        safe: false,
        reason: '内容包含敏感词',
        keywords: localKeywords,
        suggest: 'risky',
      };
    }

    // 第二步：微信内容安全API检测
    try {
      const wechatResult = await this.checkWithWechat(text);

      if (wechatResult.errcode === 0) {
        // 检测成功
        const suggest = wechatResult.result?.suggest || 'pass';
        
        if (suggest === 'pass') {
          return {
            safe: true,
            suggest: 'pass',
          };
        } else if (suggest === 'review') {
          // 建议人工复审
          return {
            safe: false,
            reason: '内容需要人工复审',
            suggest: 'review',
          };
        } else {
          // 高风险内容
          const keywords = wechatResult.detail
            ?.filter(d => d.keyword)
            .map(d => d.keyword!) || [];
          
          return {
            safe: false,
            reason: '内容包含违规信息',
            keywords,
            suggest: 'risky',
          };
        }
      } else if (wechatResult.errcode === 87014) {
        // 内容含有违法违规内容
        return {
          safe: false,
          reason: '内容包含违法违规信息',
          suggest: 'risky',
        };
      } else {
        // 其他错误，记录日志但不阻止用户
        logger.error(`微信内容安全检测返回错误: ${wechatResult.errcode} - ${wechatResult.errmsg}`);
        // API调用失败时，降级为本地检测结果
        return {
          safe: true,
          suggest: 'pass',
        };
      }
    } catch (error) {
      // 微信API调用失败，降级为本地检测结果
      logger.error('微信内容安全检测异常，使用本地检测结果:', error);
      return {
        safe: true,
        suggest: 'pass',
      };
    }
  }

  /**
   * 批量检测内容（用于历史数据审核）
   */
  public async checkBatch(texts: string[]): Promise<SecurityCheckResult[]> {
    const results: SecurityCheckResult[] = [];

    for (const text of texts) {
      const result = await this.checkContent(text);
      results.push(result);
      
      // 避免频率限制，每次检测间隔100ms
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}

// 导出单例
export const securityService = new SecurityService();
export default securityService;

