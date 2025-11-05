<template>
  <view class="content-preview">
    <view class="preview-header">
      <text class="header-title">{{ title }}</text>
      <view v-if="showActions" class="header-actions">
        <view class="action-btn" @click="handleCopy">
          <text class="action-icon">📋</text>
          <text class="action-text">复制</text>
        </view>
        <view v-if="showEdit" class="action-btn" @click="handleEdit">
          <text class="action-icon">✏️</text>
          <text class="action-text">编辑</text>
        </view>
      </view>
    </view>
    
    <view class="preview-content" :class="{ 'content-empty': !content }">
      <text v-if="content" class="content-text">{{ content }}</text>
      <text v-else class="content-placeholder">{{ placeholder }}</text>
    </view>
    
    <view v-if="meta" class="preview-meta">
      <text v-if="meta.scenario" class="meta-item">📝 {{ meta.scenario }}</text>
      <text v-if="meta.toneStyle" class="meta-item">🎨 {{ meta.toneStyle }}</text>
      <text v-if="meta.length" class="meta-item">📊 {{ meta.length }}字</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface PreviewMeta {
  scenario?: string;
  toneStyle?: string;
  length?: number;
}

interface Props {
  content: string;
  title?: string;
  placeholder?: string;
  showActions?: boolean;
  showEdit?: boolean;
  meta?: PreviewMeta;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  title: '生成结果',
  placeholder: '暂无内容',
  showActions: true,
  showEdit: false,
  meta: undefined,
});

const emit = defineEmits<{
  (e: 'copy'): void;
  (e: 'edit'): void;
}>();

// 计算内容长度
const contentLength = computed(() => {
  return props.content ? props.content.length : 0;
});

// 处理复制
const handleCopy = () => {
  if (!props.content) {
    uni.showToast({
      title: '暂无内容可复制',
      icon: 'none',
    });
    return;
  }
  emit('copy');
};

// 处理编辑
const handleEdit = () => {
  emit('edit');
};
</script>

<style scoped>
.content-preview {
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.header-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  padding: 12rpx 24rpx;
  background: #f5f7fa;
  border-radius: 8rpx;
  transition: all 0.3s ease;
}

.action-btn:active {
  opacity: 0.7;
  transform: scale(0.95);
}

.action-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.action-text {
  font-size: 24rpx;
  color: #666666;
}

.preview-content {
  padding: 32rpx;
  min-height: 300rpx;
  max-height: 800rpx;
  overflow-y: auto;
}

.content-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-text {
  font-size: 28rpx;
  line-height: 1.8;
  color: #333333;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.content-placeholder {
  font-size: 28rpx;
  color: #cccccc;
  text-align: center;
}

.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
  background: #fafbfc;
}

.meta-item {
  font-size: 24rpx;
  color: #666666;
  padding: 8rpx 16rpx;
  background: #ffffff;
  border-radius: 8rpx;
}
</style>

