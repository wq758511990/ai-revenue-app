<template>
  <view v-if="visible" class="loading-overlay" :class="{ 'loading-fullscreen': fullscreen }">
    <view class="loading-container">
      <view class="loading-spinner">
        <view class="spinner-dot" v-for="i in 8" :key="i" :style="{ transform: `rotate(${(i - 1) * 45}deg)` }">
          <view class="dot" :style="{ animationDelay: `${(i - 1) * 0.15}s` }"></view>
        </view>
      </view>
      <text v-if="text" class="loading-text">{{ text }}</text>
      <text v-if="description" class="loading-description">{{ description }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean;
  text?: string;
  description?: string;
  fullscreen?: boolean;
}

withDefaults(defineProps<Props>(), {
  visible: false,
  text: '加载中...',
  description: '',
  fullscreen: true,
});
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-fullscreen {
  background: rgba(0, 0, 0, 0.6);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

.loading-spinner {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 24rpx;
}

.spinner-dot {
  position: absolute;
  top: 0;
  left: 50%;
  width: 16rpx;
  height: 16rpx;
  transform-origin: 8rpx 40rpx;
}

.dot {
  width: 100%;
  height: 100%;
  background: #667eea;
  border-radius: 50%;
  animation: dot-fade 1.2s ease-in-out infinite;
}

@keyframes dot-fade {
  0%, 100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.loading-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 8rpx;
}

.loading-description {
  font-size: 24rpx;
  color: #999999;
  text-align: center;
  max-width: 400rpx;
}

/* AI生成特效 */
.loading-spinner.ai-effect {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  animation: ai-pulse 2s ease-in-out infinite;
}

@keyframes ai-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
  }
  50% {
    box-shadow: 0 0 0 20rpx rgba(102, 126, 234, 0);
  }
}

/* 轻量级加载（不遮罩整个屏幕） */
.loading-overlay:not(.loading-fullscreen) .loading-container {
  box-shadow: none;
  background: transparent;
}

.loading-overlay:not(.loading-fullscreen) .loading-spinner {
  width: 60rpx;
  height: 60rpx;
}

.loading-overlay:not(.loading-fullscreen) .spinner-dot {
  width: 12rpx;
  height: 12rpx;
  transform-origin: 6rpx 30rpx;
}
</style>

