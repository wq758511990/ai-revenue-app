<template>
  <view class="scenario-card" @click="handleClick">
    <view class="card-icon">
      <text class="icon-emoji">{{ scenario.icon || '📝' }}</text>
    </view>
    <view class="card-content">
      <view class="card-title">{{ scenario.name }}</view>
      <view class="card-description">{{ scenario.description }}</view>
      <view class="card-meta">
        <text class="meta-platform">{{ scenario.platform }}</text>
        <text v-if="scenario.defaultToneStyle" class="meta-tone">
          {{ getToneStyleLabel(scenario.defaultToneStyle) }}
        </text>
      </view>
    </view>
    <view class="card-arrow">
      <text class="arrow-icon">›</text>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Scenario {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  platform: string;
  defaultToneStyle?: string;
}

interface Props {
  scenario: Scenario;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'click', scenario: Scenario): void;
}>();

// 情绪风格标签映射
const toneStyleLabels: Record<string, string> = {
  ENTHUSIASTIC: '热情洋溢',
  PROFESSIONAL: '专业严谨',
  HUMOROUS: '轻松幽默',
  GENTLE: '温柔亲和',
  CONCISE: '简洁直接',
};

const getToneStyleLabel = (slug: string): string => {
  return toneStyleLabels[slug] || slug;
};

const handleClick = () => {
  emit('click', props.scenario);
};
</script>

<style scoped>
.scenario-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 24rpx;
  transition: all 0.3s ease;
}

.scenario-card:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.card-icon {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.icon-emoji {
  font-size: 48rpx;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-description {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.5;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  gap: 16rpx;
}

.meta-platform,
.meta-tone {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #f5f7fa;
  color: #666666;
}

.meta-tone {
  background: #e8f4f8;
  color: #4a90e2;
}

.card-arrow {
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.arrow-icon {
  font-size: 48rpx;
  color: #cccccc;
  line-height: 1;
}
</style>

