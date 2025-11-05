import { get, post } from '@/utils/request';

export interface QuotaInfo {
  userId: string;
  dailyQuota: number;
  usedQuota: number;
  remainingQuota: number;
  purchasedQuota: number;
  membershipType: 'FREE' | 'MONTHLY' | 'YEARLY';
  membershipExpireAt: string | null;
  resetAt: string;
}

export interface UserProfile {
  id: string;
  nickname?: string;
  avatarUrl?: string;
  membershipType: string;
  membershipExpireAt?: string;
}

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

