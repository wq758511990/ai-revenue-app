import { apiUser, type QuotaInfo } from '@/api/user';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * 配额管理Store
 */
export const useQuotaStore = defineStore('quota', () => {
  // 状态
  const quotaInfo = ref<QuotaInfo | null>(null);
  const loading = ref(false);
  const lastFetchTime = ref(0);

  // 计算属性
  const dailyRemaining = computed(() => {
    if (!quotaInfo.value) return 0;
    return Math.max(0, quotaInfo.value.dailyQuota - quotaInfo.value.usedQuota);
  });

  const totalAvailable = computed(() => {
    if (!quotaInfo.value) return 0;
    return quotaInfo.value.remainingQuota;
  });

  const isMember = computed(() => {
    if (!quotaInfo.value) return false;
    return quotaInfo.value.membershipType !== 'FREE';
  });

  const membershipExpired = computed(() => {
    if (!quotaInfo.value || !quotaInfo.value.membershipExpireAt) return false;
    return new Date(quotaInfo.value.membershipExpireAt) < new Date();
  });

  const membershipStatus = computed(() => {
    if (!quotaInfo.value) return 'FREE';
    if (membershipExpired.value) return 'EXPIRED';
    return quotaInfo.value.membershipType;
  });

  /**
   * 获取配额信息
   */
  const fetchQuota = async (force = false) => {
    // 避免频繁请求（10秒内只请求一次）
    const now = Date.now();
    if (!force && now - lastFetchTime.value < 10000) {
      return;
    }

    loading.value = true;
    try {
      quotaInfo.value = await apiUser.getQuota();
      lastFetchTime.value = now;
    } catch (error) {
      console.error('Failed to fetch quota:', error);
      uni.showToast({
        title: '获取配额失败',
        icon: 'none',
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * 扣减配额（在生成文案后调用）
   */
  const decrementQuota = () => {
    if (!quotaInfo.value) return;

    // 优先扣减每日免费额度
    if (dailyRemaining.value > 0) {
      quotaInfo.value.usedQuota++;
      quotaInfo.value.remainingQuota--;
    } else if (quotaInfo.value.purchasedQuota > 0) {
      // 扣减购买的额度
      quotaInfo.value.purchasedQuota--;
      quotaInfo.value.remainingQuota--;
    }
  };

  /**
   * 回滚配额（在生成失败时调用）
   */
  const rollbackQuota = () => {
    if (!quotaInfo.value) return;

    // 回滚上一次扣减
    if (quotaInfo.value.usedQuota > 0) {
      quotaInfo.value.usedQuota--;
      quotaInfo.value.remainingQuota++;
    } else {
      quotaInfo.value.purchasedQuota++;
      quotaInfo.value.remainingQuota++;
    }
  };

  /**
   * 检查是否有足够配额
   */
  const hasQuota = computed(() => {
    return totalAvailable.value > 0;
  });

  /**
   * 刷新配额（强制重新获取）
   */
  const refreshQuota = async () => {
    await fetchQuota(true);
  };

  /**
   * 清空配额信息（用户登出时）
   */
  const clearQuota = () => {
    quotaInfo.value = null;
    lastFetchTime.value = 0;
  };

  return {
    // 状态
    quotaInfo,
    loading,

    // 计算属性
    dailyRemaining,
    totalAvailable,
    isMember,
    membershipExpired,
    membershipStatus,
    hasQuota,

    // 方法
    fetchQuota,
    decrementQuota,
    rollbackQuota,
    refreshQuota,
    clearQuota,
  };
});

