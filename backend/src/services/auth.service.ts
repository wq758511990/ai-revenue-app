import axios from 'axios';
import { config } from '../config';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import logger from '../utils/logger';

export interface WeChatSessionResponse {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    openId: string;
    nickname: string | null;
    avatarUrl: string | null;
    membershipType: string;
    membershipExpireAt: Date | null;
  };
  isNewUser: boolean;
}

export class AuthService {
  /**
   * 获取随机猫/狗头像
   */
  private async getRandomPetAvatar(): Promise<string | null> {
    try {
      // 随机选择猫或狗
      const useCat = Math.random() > 0.5;
      
      if (useCat) {
        // 获取随机猫头像
        const response = await axios.get('https://api.thecatapi.com/v1/images/search', {
          timeout: 5000,
        });
        if (response.data && response.data[0]?.url) {
          return response.data[0].url;
        }
      } else {
        // 获取随机狗头像
        const response = await axios.get('https://dog.ceo/api/breeds/image/random', {
          timeout: 5000,
        });
        if (response.data && response.data.message) {
          return response.data.message;
        }
      }
      
      // 如果 API 失败，返回备用头像
      return `https://ui-avatars.com/api/?name=${Math.random().toString(36).substring(7)}&size=200&background=667eea&color=fff`;
    } catch (error) {
      logger.warn('获取随机头像失败，使用备用方案', error);
      // 使用备用头像服务
      return `https://ui-avatars.com/api/?name=${Math.random().toString(36).substring(7)}&size=200&background=667eea&color=fff`;
    }
  }

  /**
   * 微信登录 - code换取openid
   */
  async wechatLogin(code: string): Promise<LoginResult> {
    try {
      // 1. 调用微信API获取openid
      const wxResponse = await this.getWeChatSession(code);

      if (wxResponse.errcode) {
        throw new Error(`微信登录失败: ${wxResponse.errmsg}`);
      }

      const { openid, unionid } = wxResponse;

      // 2. 查找或创建用户
      let user = await prisma.user.findUnique({
        where: { openId: openid },
      });

      let isNewUser = false;

      if (!user) {
        // 新用户 - 创建账户，生成默认昵称和头像
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const defaultAvatar = await this.getRandomPetAvatar();
        
        user = await prisma.user.create({
          data: {
            openId: openid,
            unionId: unionid,
            nickname: `用户${randomSuffix}`,
            avatarUrl: defaultAvatar,
            membershipType: 'FREE',
            status: 'ACTIVE',
            lastLoginAt: new Date(),
          },
        });

        // 创建初始配额
        await prisma.usageQuota.create({
          data: {
            userId: user.id,
            dailyLimit: config.quota.free,
            usedToday: 0,
            lastResetDate: new Date(),
          },
        });

        isNewUser = true;
        logger.info(`新用户注册: ${user.id}`);
      } else {
        // 老用户 - 更新最后登录时间，如果没有头像则添加
        const updateData: any = { lastLoginAt: new Date() };
        
        if (!user.avatarUrl) {
          updateData.avatarUrl = await this.getRandomPetAvatar();
          logger.info(`为老用户添加默认头像: ${user.id}`);
        }
        
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }

      // 3. 生成JWT Token
      const token = generateToken({
        userId: user.id,
        openId: user.openId,
        membershipType: user.membershipType,
      });

      logger.info(`用户登录成功: ${user.id}`);

      return {
        token,
        user: {
          id: user.id,
          openId: user.openId,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          membershipType: user.membershipType,
          membershipExpireAt: user.membershipExpireAt,
        },
        isNewUser,
      };
    } catch (error) {
      logger.error('微信登录失败:', error);
      throw error;
    }
  }

  /**
   * 调用微信API获取session信息
   */
  private async getWeChatSession(code: string): Promise<WeChatSessionResponse> {
    const url = 'https://api.weixin.qq.com/sns/jscode2session';
    const params = {
      appid: config.wechat.appId,
      secret: config.wechat.appSecret,
      js_code: code,
      grant_type: 'authorization_code',
    };

    // 临时调试日志
    logger.info('微信登录请求参数', {
      appid: config.wechat.appId,
      secretLength: config.wechat.appSecret?.length,
      hasSecret: !!config.wechat.appSecret,
      codeLength: code?.length,
    });

    const response = await axios.get<WeChatSessionResponse>(url, { params });
    return response.data;
  }

  /**
   * 更新用户信息（昵称、头像等）
   */
  async updateUserProfile(userId: string, data: { nickname?: string; avatarUrl?: string }) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        nickname: data.nickname,
        avatarUrl: data.avatarUrl,
      },
    });
  }
}

export default new AuthService();

