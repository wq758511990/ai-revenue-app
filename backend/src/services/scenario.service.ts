import prisma from '../config/database';
import redis from '../config/redis';
import logger from '../utils/logger';

const CACHE_KEY = 'scenarios:all';
const CACHE_TTL = 3600; // 1小时

export class ScenarioService {
  /**
   * 获取所有场景（带缓存）
   */
  async getAllScenarios() {
    try {
      // 尝试从缓存获取
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        logger.debug('从缓存获取场景列表');
        return JSON.parse(cached);
      }

      // 从数据库获取
      const scenarios = await prisma.contentScenario.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      // 存入缓存
      await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(scenarios));

      logger.info(`获取到 ${scenarios.length} 个场景`);
      return scenarios;
    } catch (error) {
      logger.error('获取场景列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据slug获取场景
   */
  async getScenarioBySlug(slug: string) {
    const scenarios = await this.getAllScenarios();
    const scenario = scenarios.find((s: any) => s.slug === slug);

    if (!scenario) {
      throw new Error(`场景不存在: ${slug}`);
    }

    return scenario;
  }

  /**
   * 根据ID获取场景
   */
  async getScenarioById(id: string) {
    return await prisma.contentScenario.findUnique({
      where: { id },
    });
  }

  /**
   * 根据slug获取场景
   */
  async getScenarioBySlug(slug: string) {
    return await prisma.contentScenario.findUnique({
      where: { slug },
    });
  }
}

export default new ScenarioService();

