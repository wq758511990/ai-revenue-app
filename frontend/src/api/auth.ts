import { post } from '@/utils/request';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    openId: string;
    nickname?: string;
    avatarUrl?: string;
    membershipType: string;
    membershipExpireAt?: string;
  };
}

export const apiAuth = {
  /**
   * 微信登录
   */
  login(code: string): Promise<LoginResponse> {
    return post<LoginResponse>('/auth/login', { code }, false);
  },
};

