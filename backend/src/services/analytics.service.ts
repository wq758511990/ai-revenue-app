/**
 * 分析统计服务
 * 记录和分析用户行为数据
 */

import redisClient from '../config/redis';
import logger from '../utils/logger';

const REDIS_PREFIX = 'analytics';

/**
 * 统计数据类型
 */
export interface AnalyticsData {
  toneStyleUsage: Record<string, number>;
  scenarioUsage: Record<string, number>;
  totalGenerations: number;
  averageGenerationTime: number;
}

/**
 * 分析统计服务类
 */
export class AnalyticsService {
  /**
   * 记录情绪风格使用
   */
  public async recordToneStyleUsage(toneStyle: string): Promise<void> {
    try {
      const key = `${REDIS_PREFIX}:tone_style:${toneStyle}`;
      await redisClient.incr(key);
      logger.debug(`情绪风格使用记录: ${toneStyle}`);
    } catch (error) {
      logger.error('记录情绪风格使用失败:', error);
    }
  }

  /**
   * 记录场景使用
   */
  public async recordScenarioUsage(scenarioSlug: string): Promise<void> {
    try {
      const key = `${REDIS_PREFIX}:scenario:${scenarioSlug}`;
      await redisClient.incr(key);
      logger.debug(`场景使用记录: ${scenarioSlug}`);
    } catch (error) {
      logger.error('记录场景使用失败:', error);
    }
  }

  /**
   * 记录生成操作
   */
  public async recordGeneration(data: {
    userId: string;
    scenarioSlug: string;
    toneStyle: string;
    generationTime: number;
    success: boolean;
  }): Promise<void> {
    try {
      // 记录总生成次数
      await redisClient.incr(`${REDIS_PREFIX}:total_generations`);

      // 记录成功/失败次数
      if (data.success) {
        await redisClient.incr(`${REDIS_PREFIX}:successful_generations`);
      } else {
        await redisClient.incr(`${REDIS_PREFIX}:failed_generations`);
      }

      // 记录生成时间（用于计算平均值）
      await redisClient.lpush(`${REDIS_PREFIX}:generation_times`, data.generationTime.toString());
      // 只保留最近1000条记录
      await redisClient.ltrim(`${REDIS_PREFIX}:generation_times`, 0, 999);

      // 记录用户活跃度
      const today = new Date().toISOString().split('T')[0];
      await redisClient.sadd(`${REDIS_PREFIX}:active_users:${today}`, data.userId);

      // 同时记录场景和情绪风格
      await this.recordScenarioUsage(data.scenarioSlug);
      await this.recordToneStyleUsage(data.toneStyle);

      logger.debug(`生成操作记录完成: ${data.userId}`);
    } catch (error) {
      logger.error('记录生成操作失败:', error);
    }
  }

  /**
   * 获取情绪风格使用统计
   */
  public async getToneStyleUsage(): Promise<Record<string, number>> {
    try {
      const toneStyles = ['ENTHUSIASTIC', 'PROFESSIONAL', 'HUMOROUS', 'GENTLE', 'CONCISE'];
      const usage: Record<string, number> = {};

      for (const style of toneStyles) {
        const key = `${REDIS_PREFIX}:tone_style:${style}`;
        const count = await redisClient.get(key);
        usage[style] = count ? parseInt(count) : 0;
      }

      return usage;
    } catch (error) {
      logger.error('获取情绪风格统计失败:', error);
      return {};
    }
  }

  /**
   * 获取场景使用统计
   */
  public async getScenarioUsage(): Promise<Record<string, number>> {
    try {
      // 获取所有场景统计的key
      const keys = await redisClient.keys(`${REDIS_PREFIX}:scenario:*`);
      const usage: Record<string, number> = {};

      for (const key of keys) {
        const scenarioSlug = key.split(':').pop();
        const count = await redisClient.get(key);
        if (scenarioSlug && count) {
          usage[scenarioSlug] = parseInt(count);
        }
      }

      return usage;
    } catch (error) {
      logger.error('获取场景使用统计失败:', error);
      return {};
    }
  }

  /**
   * 获取总体统计数据
   */
  public async getOverallStatistics(): Promise<AnalyticsData> {
    try {
      // 获取总生成次数
      const totalGenerationsStr = await redisClient.get(`${REDIS_PREFIX}:total_generations`);
      const totalGenerations = totalGenerationsStr ? parseInt(totalGenerationsStr) : 0;

      // 获取平均生成时间
      const generationTimes = await redisClient.lrange(`${REDIS_PREFIX}:generation_times`, 0, -1);
      const averageGenerationTime =
        generationTimes.length > 0
          ? generationTimes.reduce((sum: number, time: string) => sum + parseInt(time), 0) / generationTimes.length
          : 0;

      // 获取情绪风格和场景使用统计
      const toneStyleUsage = await this.getToneStyleUsage();
      const scenarioUsage = await this.getScenarioUsage();

      return {
        toneStyleUsage,
        scenarioUsage,
        totalGenerations,
        averageGenerationTime: Math.round(averageGenerationTime),
      };
    } catch (error) {
      logger.error('获取总体统计失败:', error);
      return {
        toneStyleUsage: {},
        scenarioUsage: {},
        totalGenerations: 0,
        averageGenerationTime: 0,
      };
    }
  }

  /**
   * 获取今日活跃用户数
   */
  public async getTodayActiveUsers(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const count = await redisClient.scard(`${REDIS_PREFIX}:active_users:${today}`);
      return count;
    } catch (error) {
      logger.error('获取今日活跃用户数失败:', error);
      return 0;
    }
  }

  /**
   * 获取最受欢迎的情绪风格
   */
  public async getMostPopularToneStyle(): Promise<{ style: string; count: number } | null> {
    try {
      const usage = await this.getToneStyleUsage();
      const entries = Object.entries(usage);

      if (entries.length === 0) {
        return null;
      }

      const [style, count] = entries.reduce((max, current) => {
        return current[1] > max[1] ? current : max;
      });

      return { style, count };
    } catch (error) {
      logger.error('获取最受欢迎情绪风格失败:', error);
      return null;
    }
  }

  /**
   * 获取最受欢迎的场景
   */
  public async getMostPopularScenario(): Promise<{ scenario: string; count: number } | null> {
    try {
      const usage = await this.getScenarioUsage();
      const entries = Object.entries(usage);

      if (entries.length === 0) {
        return null;
      }

      const [scenario, count] = entries.reduce((max, current) => {
        return current[1] > max[1] ? current : max;
      });

      return { scenario, count };
    } catch (error) {
      logger.error('获取最受欢迎场景失败:', error);
      return null;
    }
  }

  /**
   * 清除统计数据（谨慎使用）
   */
  public async clearStatistics(): Promise<void> {
    try {
      const keys = await redisClient.keys(`${REDIS_PREFIX}:*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      logger.warn('统计数据已清空');
    } catch (error) {
      logger.error('清除统计数据失败:', error);
    }
  }
}

// 导出单例
export const analyticsService = new AnalyticsService();
export default analyticsService;

