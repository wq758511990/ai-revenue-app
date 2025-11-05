/**
 * 敏感词管理服务
 * 使用Redis存储和管理敏感词库
 */

import redisClient from '../config/redis';
import contentFilter from '../utils/content-filter';
import logger from '../utils/logger';

const REDIS_KEY = 'sensitive_keywords';
const REDIS_VERSION_KEY = 'sensitive_keywords_version';

/**
 * 敏感词管理服务类
 */
export class KeywordService {
  /**
   * 从Redis加载敏感词库并更新到内存过滤器
   */
  public async loadKeywords(): Promise<void> {
    try {
      const keywords = await redisClient.smembers(REDIS_KEY);
      
      if (keywords.length > 0) {
        contentFilter.clear();
        contentFilter.addKeywords(keywords);
        logger.info(`从Redis加载了 ${keywords.length} 个敏感词`);
      } else {
        logger.warn('Redis中没有敏感词数据，使用默认敏感词库');
      }
    } catch (error) {
      logger.error('从Redis加载敏感词失败:', error);
      throw error;
    }
  }

  /**
   * 添加敏感词
   */
  public async addKeyword(keyword: string): Promise<boolean> {
    if (!keyword || keyword.trim().length === 0) {
      return false;
    }

    try {
      const normalizedKeyword = keyword.trim().toLowerCase();
      
      // 添加到Redis
      const added = await redisClient.sadd(REDIS_KEY, normalizedKeyword);
      
      if (added > 0) {
        // 更新内存过滤器
        contentFilter.addKeywords([normalizedKeyword]);
        
        // 更新版本号
        await this.incrementVersion();
        
        logger.info(`敏感词已添加: ${keyword}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('添加敏感词失败:', error);
      throw error;
    }
  }

  /**
   * 批量添加敏感词
   */
  public async addKeywords(keywords: string[]): Promise<number> {
    if (!keywords || keywords.length === 0) {
      return 0;
    }

    try {
      const normalizedKeywords = keywords
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);

      if (normalizedKeywords.length === 0) {
        return 0;
      }

      // 批量添加到Redis
      const added = await redisClient.sadd(REDIS_KEY, normalizedKeywords);
      
      if (added > 0) {
        // 重新加载敏感词库
        await this.loadKeywords();
        
        // 更新版本号
        await this.incrementVersion();
        
        logger.info(`批量添加了 ${added} 个敏感词`);
      }
      
      return added;
    } catch (error) {
      logger.error('批量添加敏感词失败:', error);
      throw error;
    }
  }

  /**
   * 删除敏感词
   */
  public async removeKeyword(keyword: string): Promise<boolean> {
    if (!keyword || keyword.trim().length === 0) {
      return false;
    }

    try {
      const normalizedKeyword = keyword.trim().toLowerCase();
      
      // 从Redis删除
      const removed = await redisClient.srem(REDIS_KEY, normalizedKeyword);
      
      if (removed > 0) {
        // 重新加载敏感词库
        await this.loadKeywords();
        
        // 更新版本号
        await this.incrementVersion();
        
        logger.info(`敏感词已删除: ${keyword}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('删除敏感词失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除敏感词
   */
  public async removeKeywords(keywords: string[]): Promise<number> {
    if (!keywords || keywords.length === 0) {
      return 0;
    }

    try {
      const normalizedKeywords = keywords
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);

      if (normalizedKeywords.length === 0) {
        return 0;
      }

      // 批量从Redis删除
      const removed = await redisClient.srem(REDIS_KEY, normalizedKeywords);
      
      if (removed > 0) {
        // 重新加载敏感词库
        await this.loadKeywords();
        
        // 更新版本号
        await this.incrementVersion();
        
        logger.info(`批量删除了 ${removed} 个敏感词`);
      }
      
      return removed;
    } catch (error) {
      logger.error('批量删除敏感词失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有敏感词
   */
  public async getAllKeywords(): Promise<string[]> {
    try {
      const keywords = await redisClient.smembers(REDIS_KEY);
      return keywords.sort();
    } catch (error) {
      logger.error('获取敏感词列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取敏感词数量
   */
  public async getKeywordCount(): Promise<number> {
    try {
      const count = await redisClient.scard(REDIS_KEY);
      return count;
    } catch (error) {
      logger.error('获取敏感词数量失败:', error);
      throw error;
    }
  }

  /**
   * 检查敏感词是否存在
   */
  public async hasKeyword(keyword: string): Promise<boolean> {
    if (!keyword || keyword.trim().length === 0) {
      return false;
    }

    try {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const exists = await redisClient.sismember(REDIS_KEY, normalizedKeyword);
      return exists === 1;
    } catch (error) {
      logger.error('检查敏感词失败:', error);
      throw error;
    }
  }

  /**
   * 清空所有敏感词（慎用）
   */
  public async clearAll(): Promise<void> {
    try {
      await redisClient.del(REDIS_KEY);
      contentFilter.clear();
      await this.incrementVersion();
      logger.warn('已清空所有敏感词');
    } catch (error) {
      logger.error('清空敏感词失败:', error);
      throw error;
    }
  }

  /**
   * 导入敏感词（用于初始化或批量更新）
   * 会清空现有敏感词并导入新的
   */
  public async importKeywords(keywords: string[]): Promise<number> {
    try {
      // 清空现有敏感词
      await redisClient.del(REDIS_KEY);
      
      // 导入新敏感词
      const count = await this.addKeywords(keywords);
      
      logger.info(`已导入 ${count} 个敏感词`);
      return count;
    } catch (error) {
      logger.error('导入敏感词失败:', error);
      throw error;
    }
  }

  /**
   * 导出敏感词
   */
  public async exportKeywords(): Promise<string[]> {
    return await this.getAllKeywords();
  }

  /**
   * 获取敏感词库版本号
   */
  public async getVersion(): Promise<number> {
    try {
      const version = await redisClient.get(REDIS_VERSION_KEY);
      return version ? parseInt(version) : 0;
    } catch (error) {
      logger.error('获取敏感词库版本失败:', error);
      return 0;
    }
  }

  /**
   * 增加版本号
   */
  private async incrementVersion(): Promise<void> {
    try {
      await redisClient.incr(REDIS_VERSION_KEY);
    } catch (error) {
      logger.error('更新敏感词库版本失败:', error);
    }
  }

  /**
   * 同步敏感词库到内存（定时任务使用）
   */
  public async syncToMemory(): Promise<void> {
    try {
      const currentVersion = await this.getVersion();
      const memoryVersion = contentFilter.getKeywordCount();
      
      // 如果版本不一致，重新加载
      if (currentVersion !== memoryVersion) {
        await this.loadKeywords();
        logger.info('敏感词库已同步到内存');
      }
    } catch (error) {
      logger.error('同步敏感词库失败:', error);
    }
  }
}

// 导出单例
export const keywordService = new KeywordService();
export default keywordService;

