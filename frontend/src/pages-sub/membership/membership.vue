<template>
  <view class="membership-page">
    <!-- 会员状态卡片 -->
    <view class="status-card">
      <view class="status-icon">
        <text class="icon">
          {{ isMember ? '👑' : '💎' }}
        </text>
      </view>
      <view class="status-info">
        <text class="status-title">
          {{ statusTitle }}
        </text>
        <text class="status-desc">
          {{ statusDesc }}
        </text>
      </view>
    </view>

    <!-- 会员套餐 -->
    <view class="plans-section">
      <text class="section-title">
        选择会员套餐
      </text>
      
      <view class="plan-cards">
        <view
          v-for="plan in membershipPlans"
          :key="plan.type"
          class="plan-card"
          :class="{ 'plan-selected': selectedPlan === plan.type, 'plan-recommended': plan.recommended }"
          @click="selectPlan(plan.type)"
        >
          <view
            v-if="plan.recommended"
            class="plan-badge"
          >
            推荐
          </view>
          <text class="plan-name">
            {{ plan.name }}
          </text>
          <view class="plan-price">
            <text class="price-symbol">
              ¥
            </text>
            <text class="price-amount">
              {{ plan.price }}
            </text>
            <text class="price-unit">
              /{{ plan.unit }}
            </text>
          </view>
          <view class="plan-features">
            <view
              v-for="(feature, idx) in plan.features"
              :key="idx"
              class="feature-item"
            >
              <text class="feature-icon">
                ✓
              </text>
              <text class="feature-text">
                {{ feature }}
              </text>
            </view>
          </view>
          <text
            v-if="plan.save"
            class="plan-save"
          >
            {{ plan.save }}
          </text>
        </view>
      </view>
    </view>

    <!-- 按次购买 -->
    <view class="pay-per-use-section">
      <text class="section-title">
        按次购买
      </text>
      
      <view class="quantity-selector">
        <text class="quantity-label">
          购买次数
        </text>
        <view class="quantity-controls">
          <button
            class="quantity-btn"
            @click="decreaseQuantity"
          >
            -
          </button>
          <input
            v-model="quantity"
            class="quantity-input"
            type="number"
            @input="onQuantityInput"
          >
          <button
            class="quantity-btn"
            @click="increaseQuantity"
          >
            +
          </button>
        </view>
        <text class="quantity-price">
          ¥{{ payPerUsePrice }}
        </text>
      </view>
      
      <button
        class="buy-btn secondary"
        @click="buyPayPerUse"
      >
        购买 {{ quantity }} 次使用
      </button>
    </view>

    <!-- 购买按钮 -->
    <view class="action-section">
      <button
        class="buy-btn primary"
        :disabled="!selectedPlan || loading"
        @click="buyMembership"
      >
        {{ loading ? '处理中...' : `立即开通 ¥${selectedPlanPrice}` }}
      </button>
    </view>

    <!-- 说明 -->
    <view class="tips-section">
      <text class="tips-title">
        购买须知
      </text>
      <text class="tips-item">
        • 会员期间每日配额自动恢复
      </text>
      <text class="tips-item">
        • 按次购买不限时间，永久有效
      </text>
      <text class="tips-item">
        • 支付成功后立即生效
      </text>
      <text class="tips-item">
        • 年度会员支持7天无理由退款
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useQuotaStore } from '@/stores/quota';
import request from '@/utils/request';
import { computed, onMounted, ref } from 'vue';

const quotaStore = useQuotaStore();

// 状态
const selectedPlan = ref<string>('');
const quantity = ref<number>(10);
const loading = ref(false);

// 会员套餐配置
const membershipPlans = [
  {
    type: 'MONTHLY',
    name: '月度会员',
    price: 29.9,
    unit: '月',
    features: ['每日50次生成', '12种场景', '5种情绪风格', '历史记录保存'],
    recommended: false,
  },
  {
    type: 'YEARLY',
    name: '年度会员',
    price: 199,
    unit: '年',
    features: ['每日无限生成', '12种场景', '5种情绪风格', '历史记录保存', '优先客服'],
    recommended: true,
    save: '立省159元',
  },
];

// 计算属性
const isMember = computed(() => quotaStore.isMember);

const statusTitle = computed(() => {
  if (!quotaStore.quotaInfo) return '加载中...';
  if (isMember.value) {
    const labels: Record<string, string> = {
      MONTHLY: '月度会员',
      YEARLY: '年度会员',
    };
    return labels[quotaStore.quotaInfo.membershipType] || '会员';
  }
  return '普通用户';
});

const statusDesc = computed(() => {
  if (!quotaStore.quotaInfo) return '';
  if (isMember.value && quotaStore.quotaInfo.membershipExpireAt) {
    const expireDate = new Date(quotaStore.quotaInfo.membershipExpireAt);
    return `到期时间：${expireDate.toLocaleDateString()}`;
  }
  return `剩余 ${quotaStore.totalAvailable} 次使用机会`;
});

const selectedPlanPrice = computed(() => {
  const plan = membershipPlans.find((p) => p.type === selectedPlan.value);
  return plan ? plan.price : 0;
});

const payPerUsePrice = computed(() => {
  return (quantity.value * 2).toFixed(2);
});

// 方法
const selectPlan = (type: string) => {
  selectedPlan.value = type;
};

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const increaseQuantity = () => {
  if (quantity.value < 999) {
    quantity.value++;
  }
};

const onQuantityInput = (e: any) => {
  let val = parseInt(e.detail.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 999) val = 999;
  quantity.value = val;
};

/**
 * 购买会员
 */
const buyMembership = async () => {
  if (!selectedPlan.value) {
    uni.showToast({
      title: '请选择会员套餐',
      icon: 'none',
    });
    return;
  }

  loading.value = true;

  try {
    // 创建订单
    const orderRes = await request.post('/orders', {
      orderType: 'MEMBERSHIP',
      membershipType: selectedPlan.value,
    });

    if (orderRes.code !== 200) {
      throw new Error(orderRes.message || '创建订单失败');
    }

    const { orderId, paymentParams } = orderRes.data;

    // 调起微信支付
    await requestPayment(paymentParams, orderId);
  } catch (error: any) {
    console.error('Purchase failed:', error);
    uni.showToast({
      title: error.message || '购买失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

/**
 * 按次购买
 */
const buyPayPerUse = async () => {
  if (quantity.value < 1) {
    uni.showToast({
      title: '请输入购买数量',
      icon: 'none',
    });
    return;
  }

  loading.value = true;

  try {
    // 创建订单
    const orderRes = await request.post('/orders', {
      orderType: 'PAY_PER_USE',
      quantity: quantity.value,
    });

    if (orderRes.code !== 200) {
      throw new Error(orderRes.message || '创建订单失败');
    }

    const { orderId, paymentParams } = orderRes.data;

    // 调起微信支付
    await requestPayment(paymentParams, orderId);
  } catch (error: any) {
    console.error('Purchase failed:', error);
    uni.showToast({
      title: error.message || '购买失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

/**
 * 调起微信支付
 */
const requestPayment = (paymentParams: any, orderId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      ...paymentParams,
      success: async () => {
        uni.showToast({
          title: '支付成功',
          icon: 'success',
        });

        // 轮询订单状态
        await pollOrderStatus(orderId);
        
        // 刷新配额
        await quotaStore.refreshQuota();
        
        resolve();
      },
      fail: (err: any) => {
        if (err.errMsg === 'requestPayment:fail cancel') {
          uni.showToast({
            title: '支付已取消',
            icon: 'none',
          });
        } else {
          uni.showToast({
            title: '支付失败',
            icon: 'none',
          });
        }
        reject(err);
      },
    });
  });
};

/**
 * 轮询订单状态
 */
const pollOrderStatus = async (orderId: string, maxAttempts = 10): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await request.get(`/orders/${orderId}/status`);
      if (res.code === 0 && res.data.paid) {
        return;
      }
    } catch (error) {
      console.error('Poll order status failed:', error);
    }

    // 等待2秒后重试
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('订单状态查询超时');
};

// 生命周期
onMounted(() => {
  quotaStore.fetchQuota();
  
  // 默认选中推荐套餐
  const recommended = membershipPlans.find((p) => p.recommended);
  if (recommended) {
    selectedPlan.value = recommended.type;
  }
});
</script>

<style scoped>
.membership-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 32rpx;
  padding-bottom: 200rpx;
}

/* 会员状态卡片 */
.status-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 8rpx 16rpx rgba(102, 126, 234, 0.3);
}

.status-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin-right: 24rpx;
}

.status-icon .icon {
  font-size: 40rpx;
}

.status-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.status-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8rpx;
}

.status-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 套餐区域 */
.plans-section {
  margin-bottom: 32rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

.plan-cards {
  display: flex;
  gap: 24rpx;
}

.plan-card {
  position: relative;
  flex: 1;
  padding: 32rpx;
  background: #ffffff;
  border-radius: 16rpx;
  border: 2rpx solid #e0e0e0;
  transition: all 0.3s ease;
}

.plan-card.plan-selected {
  border-color: #667eea;
  box-shadow: 0 8rpx 16rpx rgba(102, 126, 234, 0.2);
}

.plan-card.plan-recommended {
  border-color: #ffd700;
}

.plan-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 8rpx 16rpx;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  border-radius: 16rpx;
  font-size: 20rpx;
  color: #ffffff;
  font-weight: bold;
}

.plan-name {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.plan-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 24rpx;
}

.price-symbol {
  font-size: 24rpx;
  color: #667eea;
}

.price-amount {
  font-size: 48rpx;
  font-weight: bold;
  color: #667eea;
}

.price-unit {
  font-size: 24rpx;
  color: #999;
  margin-left: 8rpx;
}

.plan-features {
  margin-bottom: 16rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.feature-icon {
  width: 32rpx;
  color: #52c41a;
  margin-right: 8rpx;
}

.feature-text {
  font-size: 24rpx;
  color: #666;
}

.plan-save {
  display: block;
  font-size: 24rpx;
  color: #ff6b6b;
  text-align: center;
  font-weight: 500;
}

/* 按次购买 */
.pay-per-use-section {
  padding: 32rpx;
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}

.quantity-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.quantity-label {
  font-size: 28rpx;
  color: #333;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.quantity-btn {
  width: 64rpx;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  background: #f5f5f5;
  border: none;
  border-radius: 8rpx;
  font-size: 32rpx;
  color: #333;
  padding: 0;
}

.quantity-input {
  width: 120rpx;
  height: 64rpx;
  text-align: center;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.quantity-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
}

/* 购买按钮 */
.action-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  background: #ffffff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.buy-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  transition: all 0.3s ease;
}

.buy-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.buy-btn.secondary {
  background: #f5f5f5;
  color: #667eea;
}

.buy-btn:disabled {
  opacity: 0.5;
}

.buy-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

/* 说明 */
.tips-section {
  padding: 32rpx;
  background: #ffffff;
  border-radius: 16rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.tips-item {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8rpx;
}
</style>

