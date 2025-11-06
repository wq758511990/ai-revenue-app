import { get, post } from '@/utils/request';
import type { QuotaInfo, UserProfile } from '@/types';

export const apiUser = {
  /**
   * 获取用户配额信息
   */
  getQuota(): Promise<QuotaInfo> {
    return get<QuotaInfo>('/user/quota');
  },

  /**
   * 获取用户资料
   */
  getProfile(): Promise<UserProfile> {
    return get<UserProfile>('/user/profile');
  },

  /**
   * 更新用户资料
   */
  updateProfile(data: { nickname?: string; avatarUrl?: string }): Promise<void> {
    return post<void>('/user/profile', data);
  },
};

