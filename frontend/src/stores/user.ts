import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiAuth } from '@/api/auth';

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>('');
  const userId = ref<string>('');
  const openId = ref<string>('');
  const nickname = ref<string>('');
  const avatarUrl = ref<string>('');
  const membershipType = ref<string>('FREE');
  const membershipExpireAt = ref<string | null>(null);
  const isLoggedIn = ref<boolean>(false);

  // Actions
  const setToken = (newToken: string) => {
    token.value = newToken;
    uni.setStorageSync('token', newToken);
  };

  const setUserInfo = (userInfo: any) => {
    userId.value = userInfo.id;
    openId.value = userInfo.openId;
    nickname.value = userInfo.nickname || '用户';
    avatarUrl.value = userInfo.avatarUrl || '';
    membershipType.value = userInfo.membershipType || 'FREE';
    membershipExpireAt.value = userInfo.membershipExpireAt;
    isLoggedIn.value = true;
  };

  const initUser = async () => {
    const storedToken = uni.getStorageSync('token');
    if (storedToken) {
      token.value = storedToken;
      isLoggedIn.value = true;
    } else {
      // 没有token，确保登录状态为false
      isLoggedIn.value = false;
    }
  };

  const login = async (code: string) => {
    try {
      const response = await apiAuth.login(code);
      setToken(response.token);
      setUserInfo(response.user);
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  };

  const logout = () => {
    token.value = '';
    userId.value = '';
    openId.value = '';
    nickname.value = '';
    avatarUrl.value = '';
    membershipType.value = 'FREE';
    membershipExpireAt.value = null;
    isLoggedIn.value = false;
    uni.removeStorageSync('token');
  };

  return {
    // State
    token,
    userId,
    openId,
    nickname,
    avatarUrl,
    membershipType,
    membershipExpireAt,
    isLoggedIn,
    // Actions
    setToken,
    setUserInfo,
    initUser,
    login,
    logout,
  };
});

