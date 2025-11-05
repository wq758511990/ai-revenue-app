import redis from '../config/redis';
import logger from './logger';

interface AICallMetrics {
  provider: string;
  success: boolean;
  duration: number;
  model: string;
  tokens?: number;
  timestamp: Date;
}

/**
 * AI Provider监控工具
 */
export class AIMonitor {
  private static readonly REDIS_KEY_PREFIX = 'ai:metrics:';
  private static readonly METRICS_EXPIRY = 86400; // 24小时

  /**
   * 记录AI调用指标
   */
  static async recordCall(metrics: AICallMetrics) {
    try {
      const key = this.getMetricsKey(metrics.provider);
      const data = {
        ...metrics,
        timestamp: metrics.timestamp.toISOString(),
      };

      // 存储到Redis列表
      await redis.lpush(key, JSON.stringify(data));
      await redis.expire(key, this.METRICS_EXPIRY);

      // 记录日志
      logger.info('AI调用指标', {
        provider: metrics.provider,
        success: metrics.success,
        duration: `${metrics.duration}ms`,
        tokens: metrics.tokens,
      });
    } catch (error) {
      logger.error('记录AI指标失败:', error);
    }
  }

  /**
   * 获取provider的统计数据
   */
  static async getProviderStats(provider: string): Promise<{
    totalCalls: number;
    successRate: number;
    avgDuration: number;
    avgTokens: number;
  }> {
    try {
      const key = this.getMetricsKey(provider);
      const metricsData = await redis.lrange(key, 0, -1);

      if (metricsData.length === 0) {
        return {
          totalCalls: 0,
          successRate: 0,
          avgDuration: 0,
          avgTokens: 0,
        };
      }

      const metrics = metricsData.map((data: string) => JSON.parse(data) as AICallMetrics);

      const totalCalls = metrics.length;
      const successCalls = metrics.filter((m: AICallMetrics) => m.success).length;
      const totalDuration = metrics.reduce((sum: number, m: AICallMetrics) => sum + m.duration, 0);
      const totalTokens = metrics.reduce((sum: number, m: AICallMetrics) => sum + (m.tokens || 0), 0);

      return {
        totalCalls,
        successRate: (successCalls / totalCalls) * 100,
        avgDuration: totalDuration / totalCalls,
        avgTokens: totalTokens / totalCalls,
      };
    } catch (error) {
      logger.error('获取provider统计失败:', error);
      return {
        totalCalls: 0,
        successRate: 0,
        avgDuration: 0,
        avgTokens: 0,
      };
    }
  }

  private static getMetricsKey(provider: string): string {
    return `${this.REDIS_KEY_PREFIX}${provider.toLowerCase()}`;
  }
}

export default AIMonitor;

