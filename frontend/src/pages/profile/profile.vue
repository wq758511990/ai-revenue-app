<template>
  <view class="profile-page">
    <!-- 未登录状态 -->
    <view
      v-if="!userStore.isLoggedIn"
      class="login-prompt"
    >
      <text class="prompt-icon">
        👤
      </text>
      <text class="prompt-text">
        请先登录
      </text>
      <button
        class="login-btn"
        @click="handleLogin"
      >
        微信一键登录
      </button>
    </view>

    <!-- 已登录状态 -->
    <view v-else>
      <!-- 用户信息卡片 -->
      <view
        class="user-card"
        @click="editProfile"
      >
        <image
          class="user-avatar"
          :src="userInfo?.avatarUrl || defaultAvatar"
          mode="aspectFill"
        />
        <view class="user-info">
          <text class="user-name">
            {{ userInfo?.nickname || '用户' }}
          </text>
          <view
            class="member-badge"
            :class="membershipClass"
          >
            <text class="badge-icon">
              {{ membershipIcon }}
            </text>
            <text class="badge-text">
              {{ membershipLabel }}
            </text>
          </view>
        </view>
        <text class="edit-icon">
          ›
        </text>
      </view>

      <!-- 配额统计 -->
      <view class="quota-stats">
        <view class="stat-item">
          <text class="stat-value">
            {{ quotaStore.dailyRemaining }}
          </text>
          <view class="stat-label-row">
            <text class="stat-label">
              今日剩余
            </text>
            <view
              class="refresh-btn"
              @click.stop="refreshQuota"
            >
              <text class="refresh-icon">
                🔄
              </text>
            </view>
          </view>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-value">
            {{ purchasedQuota }}
          </text>
          <text class="stat-label">
            已购次数
          </text>
        </view>
      </view>

      <!-- 功能菜单 -->
      <MenuList :items="menuItems" />

      <!-- 会员信息 -->
      <view
        v-if="isMember"
        class="membership-info"
      >
        <view class="info-row">
          <text class="info-label">
            会员类型
          </text>
          <text class="info-value">
            {{ membershipLabel }}
          </text>
        </view>
        <view class="info-row">
          <text class="info-label">
            到期时间
          </text>
          <text class="info-value">
            {{ membershipExpireDate }}
          </text>
        </view>
        <button
          class="renew-btn"
          @click="goToMembership"
        >
          续费
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import MenuList, { type MenuItem } from '@/components/MenuList.vue';
import { useQuotaStore } from '@/stores/quota';
import { useUserStore } from '@/stores/user';
import { computed, onMounted } from 'vue';

const userStore = useUserStore();
const quotaStore = useQuotaStore();

const defaultAvatar = 'https://via.placeholder.com/150';

// 计算属性
const userInfo = computed(() => ({
  nickname: userStore.nickname,
  avatarUrl: userStore.avatarUrl,
  membershipType: userStore.membershipType,
}));

const isMember = computed(() => quotaStore.isMember);

const purchasedQuota = computed(() => {
  return quotaStore.quotaInfo?.purchasedQuota || 0;
});

const membershipClass = computed(() => {
  if (!quotaStore.quotaInfo) return 'badge-free';
  const type = quotaStore.quotaInfo.membershipType;
  return `badge-${type.toLowerCase()}`;
});

const membershipIcon = computed(() => {
  if (!quotaStore.quotaInfo) return '💎';
  const icons: Record<string, string> = {
    FREE: '💎',
    MONTHLY: '👑',
    YEARLY: '💫',
  };
  return icons[quotaStore.quotaInfo.membershipType] || '💎';
});

const membershipLabel = computed(() => {
  if (!quotaStore.quotaInfo) return '免费用户';
  const labels: Record<string, string> = {
    FREE: '免费用户',
    MONTHLY: '月度会员',
    YEARLY: '年度会员',
  };
  return labels[quotaStore.quotaInfo.membershipType] || '免费用户';
});

const membershipExpireDate = computed(() => {
  if (!quotaStore.quotaInfo || !quotaStore.quotaInfo.membershipExpireAt) {
    return '-';
  }
  const date = new Date(quotaStore.quotaInfo.membershipExpireAt);
  return date.toLocaleDateString('zh-CN');
});

// 菜单配置
const menuItems = computed<MenuItem[]>(() => [
  // 会员中心和我的订单临时隐藏（支付功能开发中）
  // { id: 'membership', icon: '👑', label: '会员中心', onClick: goToMembership },
  // { id: 'orders', icon: '📋', label: '我的订单', onClick: goToOrders },
  { id: 'history', icon: '📝', label: '生成历史', onClick: goToHistory },
  { id: 'feedback', icon: '💬', label: '意见反馈', onClick: goToFeedback },
]);

// 方法
const goToMembership = () => {
  uni.navigateTo({
    url: '/pages-sub/membership/membership',
  });
};

// 临时隐藏（支付功能开发中）
// const goToOrders = () => {
//   uni.showToast({
//     title: '功能开发中',
//     icon: 'none',
//   });
// };

const goToHistory = () => {
  uni.navigateTo({
    url: '/pages-sub/profile/history',
  });
};

const goToFeedback = () => {
  uni.navigateTo({
    url: '/pages-sub/profile/feedback',
  });
};

// 登录处理
const handleLogin = async () => {
  try {
    uni.showLoading({ title: '登录中...' });
    
    // 获取微信登录code
    const loginRes = await uni.login();
    
    if (loginRes.code) {
      // 登录获取token
      await userStore.login(loginRes.code);
      
      uni.hideLoading();
      uni.showToast({
        title: '登录成功',
        icon: 'success',
      });
      
      // 登录成功后加载配额
      quotaStore.fetchQuota();
    } else {
      uni.hideLoading();
      uni.showToast({
        title: '登录失败，请重试',
        icon: 'none',
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('登录失败:', error);
    uni.showToast({
      title: (error as Error).message || '登录失败',
      icon: 'none',
    });
  }
};

// 编辑个人资料
const editProfile = () => {
  uni.showToast({
    title: '昵称头像编辑功能开发中',
    icon: 'none',
    duration: 2000,
  });
};

// 刷新配额
const refreshQuota = async () => {
  try {
    uni.showLoading({ title: '刷新中...' });
    await quotaStore.fetchQuota();
    uni.hideLoading();
    uni.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1500,
    });
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: '刷新失败',
      icon: 'none',
    });
  }
};

// 生命周期
onMounted(() => {
  // 如果显示已登录但是没有用户信息，说明token可能无效，清除重新登录
  if (userStore.isLoggedIn && !userStore.userId) {
    console.log('检测到无效登录状态，清除重新登录');
    userStore.logout();
  }
  
  if (userStore.isLoggedIn) {
    quotaStore.fetchQuota();
  }
});
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 32rpx;
}

/* 用户信息卡片 */
.user-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 16rpx rgba(102, 126, 234, 0.3);
  position: relative;
}

.user-card .edit-icon {
  position: absolute;
  right: 32rpx;
  font-size: 48rpx;
  color: rgba(255, 255, 255, 0.6);
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  margin-right: 24rpx;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.member-badge {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 8rpx 16rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.2);
}

.member-badge.badge-monthly,
.member-badge.badge-yearly {
  background: rgba(255, 215, 0, 0.3);
}

.badge-icon {
  font-size: 24rpx;
  margin-right: 8rpx;
}

.badge-text {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 500;
}

/* 配额统计 */
.quota-stats {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.stat-label-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  background: #f5f7fa;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.refresh-btn:active {
  background: #e8eaed;
  transform: rotate(180deg);
}

.refresh-icon {
  font-size: 24rpx;
}

.stat-divider {
  width: 2rpx;
  height: 64rpx;
  background: #e0e0e0;
}

/* 会员信息 */
.membership-info {
  padding: 32rpx;
  background: #ffffff;
  border-radius: 16rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #f5f5f5;
}

.info-row:last-of-type {
  border-bottom: none;
  margin-bottom: 24rpx;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.renew-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
}

.renew-btn:active {
  opacity: 0.8;
}

/* 登录提示 */
.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 32rpx;
  background: #ffffff;
  border-radius: 16rpx;
}

.login-prompt .prompt-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.login-prompt .prompt-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 48rpx;
}

.login-prompt .login-btn {
  width: 400rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 44rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
}

.login-prompt .login-btn:active {
  opacity: 0.8;
}
</style>

