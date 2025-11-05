<template>
  <view
    class="quota-display"
    :class="{ 'quota-low': isLow, 'is-member': isMember }"
  >
    <view class="quota-icon">
      <text class="icon">
        {{ isMember ? '👑' : '💎' }}
      </text>
    </view>
    <view class="quota-info">
      <view class="quota-header">
        <view class="quota-label">
          {{ isMember ? '会员剩余' : '剩余次数' }}
        </view>
        <view
          v-if="isMember"
          class="member-badge"
        >
          {{ membershipLabel }}
        </view>
      </view>
      <view class="quota-count">
        <text class="count-number">
          {{ displayQuota }}
        </text>
        <text class="count-unit">
          次
        </text>
      </view>
      <view
        v-if="showDetails && quotaStore.quotaInfo"
        class="quota-detail"
      >
        <text class="detail-text">
          每日: {{ quotaStore.dailyRemaining }}/{{ quotaStore.quotaInfo.dailyLimit }}
        </text>
        <text
          v-if="quotaStore.quotaInfo.purchasedQuota > 0"
          class="detail-text"
        >
          | 已购: {{ quotaStore.quotaInfo.purchasedQuota }}
        </text>
      </view>
    </view>
    <view
      v-if="showUpgrade && (isLow || !isMember)"
      class="quota-action"
      @click="handleUpgrade"
    >
      <text class="action-text">
        {{ isMember ? '充值' : '开通会员' }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useQuotaStore } from '@/stores/quota';
import { computed, onMounted } from 'vue';

interface Props {
  showUpgrade?: boolean;
  lowThreshold?: number;
  showDetails?: boolean;
  autoRefresh?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showUpgrade: true,
  lowThreshold: 3,
  showDetails: false,
  autoRefresh: true,
});

const emit = defineEmits<{
  (e: 'upgrade'): void;
}>();

const quotaStore = useQuotaStore();

// 显示的配额
const displayQuota = computed(() => {
  return quotaStore.totalAvailable;
});

// 是否处于低配额状态
const isLow = computed(() => {
  return quotaStore.totalAvailable <= props.lowThreshold;
});

// 是否为会员
const isMember = computed(() => {
  return quotaStore.isMember;
});

// 会员标签
const membershipLabel = computed(() => {
  if (!quotaStore.quotaInfo) return '';
  const labels: Record<string, string> = {
    MONTHLY: '月度会员',
    YEARLY: '年度会员',
  };
  return labels[quotaStore.quotaInfo.membershipType] || '';
});

// 处理升级点击
const handleUpgrade = () => {
  emit('upgrade');
  // 默认跳转到会员购买页
  uni.navigateTo({
    url: '/pages-sub/membership/membership',
  });
};

// 组件挂载时自动获取配额
onMounted(() => {
  if (props.autoRefresh) {
    quotaStore.fetchQuota();
  }
});
</script>

<style scoped>
.quota-display {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  box-shadow: 0 8rpx 16rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.quota-display.quota-low {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.quota-display.is-member {
  background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
}

.quota-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin-right: 24rpx;
}

.icon {
  font-size: 32rpx;
}

.quota-info {
  flex: 1;
}

.quota-header {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.quota-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.member-badge {
  margin-left: 16rpx;
  padding: 4rpx 12rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8rpx;
  font-size: 20rpx;
  color: #ffffff;
}

.quota-count {
  display: flex;
  align-items: baseline;
}

.count-number {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  line-height: 1;
}

.count-unit {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 8rpx;
}

.quota-detail {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
}

.detail-text {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
}

.quota-action {
  padding: 16rpx 32rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 48rpx;
  transition: all 0.3s ease;
}

.quota-action:active {
  opacity: 0.8;
  transform: scale(0.95);
}

.action-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #667eea;
}

.quota-display.quota-low .action-text {
  color: #f5576c;
}

.quota-display.is-member .action-text {
  color: #19547b;
}
</style>

