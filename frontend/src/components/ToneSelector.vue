<template>
  <view class="tone-selector">
    <view class="selector-header">
      <text class="header-title">选择情绪风格</text>
      <view v-if="showSuggest" class="suggest-btn" @click="handleSuggest">
        <text class="suggest-icon">💡</text>
        <text class="suggest-text">建议新风格</text>
      </view>
    </view>

    <view class="tone-list">
      <view
        v-for="tone in toneStyles"
        :key="tone.slug"
        class="tone-item"
        :class="{ 
          active: modelValue === tone.slug,
          animating: animatingStyle === tone.slug
        }"
        @click="selectTone(tone)"
      >
        <view class="tone-content">
          <text class="tone-icon">{{ tone.icon }}</text>
          <text class="tone-name">{{ tone.name }}</text>
        </view>
        <text v-if="modelValue === tone.slug" class="check-icon">✓</text>
      </view>
    </view>

    <view v-if="selectedTone" class="tone-description">
      <text class="description-text">{{ selectedTone.description }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface ToneStyle {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

interface Props {
  modelValue?: string;
  toneStyles: ToneStyle[];
  showSuggest?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  showSuggest: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'suggest'): void;
}>();

// 正在切换动画的风格
const animatingStyle = ref('');

// 当前选中的风格对象
const selectedTone = computed(() => {
  return props.toneStyles.find(t => t.slug === props.modelValue);
});

// 选择情绪风格
const selectTone = (tone: ToneStyle) => {
  if (props.modelValue === tone.slug) {
    return; // 已经选中，不重复触发
  }

  // 触发切换动画
  animatingStyle.value = tone.slug;
  setTimeout(() => {
    animatingStyle.value = '';
  }, 300);

  // 触发值更新
  emit('update:modelValue', tone.slug);

  // 播放触觉反馈
  uni.vibrateShort({
    type: 'light',
  });
};

// 建议新风格
const handleSuggest = () => {
  emit('suggest');
};

// 监听外部值变化（如重置）
watch(() => props.modelValue, (newValue, oldValue) => {
  if (newValue !== oldValue && newValue) {
    // 外部更改时也播放动画
    animatingStyle.value = newValue;
    setTimeout(() => {
      animatingStyle.value = '';
    }, 300);
  }
});
</script>

<style scoped>
.tone-selector {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.suggest-btn {
  display: flex;
  align-items: center;
  padding: 12rpx 24rpx;
  background: #f5f7fa;
  border-radius: 48rpx;
  transition: all 0.3s ease;
}

.suggest-btn:active {
  opacity: 0.7;
  transform: scale(0.95);
}

.suggest-icon {
  font-size: 24rpx;
  margin-right: 8rpx;
}

.suggest-text {
  font-size: 24rpx;
  color: #666666;
}

.tone-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200rpx, 1fr));
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.tone-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32rpx 24rpx;
  background: #f5f7fa;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
}

.tone-item:active {
  transform: scale(0.95);
}

.tone-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.tone-item.animating {
  animation: tone-pulse 0.3s ease;
}

@keyframes tone-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.tone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tone-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
  transition: transform 0.3s ease;
}

.tone-item.active .tone-icon {
  transform: scale(1.1);
}

.tone-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #333333;
  text-align: center;
  transition: color 0.3s ease;
}

.tone-item.active .tone-name {
  color: #ffffff;
  font-weight: 600;
}

.check-icon {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  font-size: 28rpx;
  color: #ffffff;
  font-weight: bold;
}

.tone-description {
  padding: 24rpx;
  background: #f9fafb;
  border-radius: 12rpx;
  border-left: 4rpx solid #667eea;
}

.description-text {
  font-size: 24rpx;
  line-height: 1.6;
  color: #666666;
}

/* 响应式调整 */
@media (max-width: 600rpx) {
  .tone-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

