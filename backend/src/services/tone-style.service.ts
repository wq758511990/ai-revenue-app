import prisma from '../config/database';
import redis from '../config/redis';
import logger from '../utils/logger';

const CACHE_KEY = 'tone:styles:all';
const CACHE_TTL = 3600; // 1小时

export class ToneStyleService {
  /**
   * 获取所有情绪风格（带缓存）
   */
  async getAllStyles() {
    try {
      // 尝试从缓存获取
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        logger.debug('从缓存获取情绪风格');
        return JSON.parse(cached);
      }

      // 从数据库获取
      const styles = await prisma.toneStyle.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      // 存入缓存
      await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(styles));

      logger.info(`获取到 ${styles.length} 个情绪风格`);
      return styles;
    } catch (error) {
      logger.error('获取情绪风格失败:', error);
      throw error;
    }
  }

  /**
   * 根据slug获取情绪风格
   */
  async getStyleBySlug(slug: string) {
    const styles = await this.getAllStyles();
    const style = styles.find((s: any) => s.slug === slug);

    if (!style) {
      throw new Error(`情绪风格不存在: ${slug}`);
    }

    return style;
  }

  /**
   * 创建或更新情绪风格
   */
  async upsertStyle(data: {
    slug: string;
    name: string;
    description?: string;
    promptModifier: string;
    sortOrder?: number;
  }) {
    try {
      const style = await prisma.toneStyle.upsert({
        where: { slug: data.slug },
        update: {
          name: data.name,
          description: data.description,
          promptModifier: data.promptModifier,
          sortOrder: data.sortOrder,
        },
        create: data,
      });

      // 清除缓存
      await redis.del(CACHE_KEY);

      logger.info(`情绪风格已更新: ${style.slug}`);
      return style;
    } catch (error) {
      logger.error('更新情绪风格失败:', error);
      throw error;
    }
  }

  /**
   * 清除缓存
   */
  async clearCache() {
    await redis.del(CACHE_KEY);
    logger.info('情绪风格缓存已清除');
  }
}

export default new ToneStyleService();

