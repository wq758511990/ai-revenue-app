import prisma from '../config/database';
import logger from '../utils/logger';

export interface CreateContentRecordData {
  userId: string;
  scenarioId: string;
  toneStyle: string;
  userInput: Record<string, any>;
  generatedContent: string;
  generationTime: number;
  aiModel: string;
}

export class ContentRecordService {
  /**
   * 创建文案记录
   */
  async createRecord(data: CreateContentRecordData) {
    try {
      const record = await prisma.contentRecord.create({
        data: {
          userId: data.userId,
          scenarioId: data.scenarioId,
          toneStyle: data.toneStyle,
          userInput: data.userInput,
          generatedContent: data.generatedContent,
          generationTime: data.generationTime,
          aiModel: data.aiModel,
        },
      });

      logger.info(`文案记录已保存: ${record.id}`);
      return record;
    } catch (error) {
      logger.error('保存文案记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的文案记录列表
   */
  async getUserRecords(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [records, total] = await Promise.all([
      prisma.contentRecord.findMany({
        where: { userId },
        include: {
          scenario: {
            select: {
              name: true,
              slug: true,
              platform: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.contentRecord.count({
        where: { userId },
      }),
    ]);

    return {
      records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取单条记录
   */
  async getRecordById(id: string, userId: string) {
    const record = await prisma.contentRecord.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        scenario: true,
      },
    });

    if (!record) {
      throw new Error('记录不存在');
    }

    return record;
  }

  /**
   * 编辑文案内容
   */
  async editContent(id: string, userId: string, editedContent: string) {
    const record = await prisma.contentRecord.findFirst({
      where: { id, userId },
    });

    if (!record) {
      throw new Error('记录不存在');
    }

    return await prisma.contentRecord.update({
      where: { id },
      data: {
        isEdited: true,
        editedContent,
      },
    });
  }

  /**
   * 获取"再次使用"所需的数据（场景和输入信息）
   */
  async getReuseData(id: string, userId: string) {
    const record = await prisma.contentRecord.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        scenario: {
          select: {
            id: true,
            name: true,
            slug: true,
            inputSchema: true,
            defaultToneStyle: true,
          },
        },
      },
    });

    if (!record) {
      throw new Error('记录不存在');
    }

    return {
      scenario: record.scenario,
      userInput: record.userInput,
      toneStyle: record.toneStyle,
    };
  }

  /**
   * 获取用户的历史统计信息
   */
  async getUserStats(userId: string) {
    try {
      const [
        totalCount,
        scenarioStats,
        toneStyleStats,
        recentCount,
      ] = await Promise.all([
        // 总生成次数
        prisma.contentRecord.count({
          where: { userId },
        }),
        // 各场景使用次数（前5个）
        prisma.contentRecord.groupBy({
          by: ['scenarioId'],
          where: { userId },
          _count: true,
          orderBy: {
            _count: {
              scenarioId: 'desc',
            },
          },
          take: 5,
        }),
        // 各情绪风格使用次数
        prisma.contentRecord.groupBy({
          by: ['toneStyle'],
          where: { userId },
          _count: true,
          orderBy: {
            _count: {
              toneStyle: 'desc',
            },
          },
        }),
        // 最近7天生成次数
        prisma.contentRecord.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      return {
        totalCount,
        recentCount,
        scenarioStats: scenarioStats.map((s) => ({
          scenarioId: s.scenarioId,
          count: s._count,
        })),
        toneStyleStats: toneStyleStats.map((t) => ({
          toneStyle: t.toneStyle,
          count: t._count,
        })),
      };
    } catch (error) {
      logger.error('获取用户统计失败:', error);
      throw error;
    }
  }
}

export default new ContentRecordService();

