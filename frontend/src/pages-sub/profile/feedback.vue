<template>
  <view class="feedback-page">
    <view class="page-header">
      <text class="header-title">
        反馈与建议
      </text>
      <text class="header-desc">
        您的反馈将帮助我们改进产品
      </text>
    </view>

    <!-- 反馈类型选择 -->
    <view class="feedback-types">
      <view
        v-for="type in feedbackTypes"
        :key="type.value"
        class="type-card"
        :class="{ active: selectedType === type.value }"
        @click="selectType(type.value)"
      >
        <view class="type-icon">
          {{ type.icon }}
        </view>
        <view class="type-name">
          {{ type.label }}
        </view>
        <view class="type-desc">
          {{ type.desc }}
        </view>
      </view>
    </view>

    <!-- 反馈内容输入 -->
    <view class="feedback-content">
      <view class="content-label">
        <text>反馈内容</text>
        <text
          class="char-count"
          :class="{ error: content.length > 200 }"
        >
          {{ content.length }}/200
        </text>
      </view>
      <textarea
        v-model="content"
        class="content-textarea"
        placeholder="请详细描述您的反馈或建议（5-200字）"
        :maxlength="200"
        :auto-height="true"
        :show-confirm-bar="false"
      />
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button
        class="submit-btn"
        :disabled="!canSubmit || submitting"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '提交反馈' }}
      </button>
      
      <view
        class="history-link"
        @click="goToHistory"
      >
        <text>查看我的反馈历史</text>
        <text class="arrow">
          →
        </text>
      </view>
    </view>

    <!-- 提示信息 -->
    <view class="tips">
      <view class="tip-item">
        💡 我们会认真阅读每一条反馈
      </view>
      <view class="tip-item">
        ✨ 优质建议可能获得额外奖励
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { submitFeedback, type FeedbackType } from '@/api/feedback';
import { computed, ref } from 'vue';

interface FeedbackTypeOption {
  value: FeedbackType;
  label: string;
  icon: string;
  desc: string;
}

// 反馈类型选项
const feedbackTypes: FeedbackTypeOption[] = [
  {
    value: 'NEW_TONE',
    label: '建议新增情绪风格',
    icon: '🎨',
    desc: '建议添加新的文案风格',
  },
  {
    value: 'NEW_SCENARIO',
    label: '建议新增场景',
    icon: '📝',
    desc: '建议添加新的使用场景',
  },
  {
    value: 'FEATURE_REQUEST',
    label: '功能建议',
    icon: '💡',
    desc: '建议新功能或改进',
  },
  {
    value: 'BUG_REPORT',
    label: '问题反馈',
    icon: '🐛',
    desc: '反馈使用中遇到的问题',
  },
];

// 状态
const selectedType = ref<FeedbackType>('FEATURE_REQUEST');
const content = ref('');
const submitting = ref(false);

// 是否可以提交
const canSubmit = computed(() => {
  const trimmed = content.value.trim();
  return trimmed.length >= 5 && trimmed.length <= 200 && selectedType.value;
});

// 选择反馈类型
const selectType = (type: FeedbackType) => {
  selectedType.value = type;
};

// 提交反馈
const handleSubmit = async () => {
  if (!canSubmit.value || submitting.value) return;

  try {
    submitting.value = true;

    await submitFeedback({
      feedbackType: selectedType.value,
      content: content.value.trim(),
    });

    uni.showToast({
      title: '提交成功',
      icon: 'success',
    });

    // 清空表单
    content.value = '';
    selectedType.value = 'FEATURE_REQUEST';

    // 延迟跳转到历史页面
    setTimeout(() => {
      goToHistory();
    }, 1500);
  } catch (error: any) {
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
};

// 跳转到历史页面
const goToHistory = () => {
  uni.navigateTo({
    url: '/pages-sub/profile/feedback-history',
  });
};
</script>

<style scoped>
.feedback-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 32rpx;
}

.page-header {
  margin-bottom: 32rpx;
}

.header-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12rpx;
}

.header-desc {
  display: block;
  font-size: 28rpx;
  color: #909399;
}

/* 反馈类型 */
.feedback-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.type-card {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
  text-align: center;
  border: 2rpx solid #e4e7ed;
  transition: all 0.3s;
}

.type-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.type-icon {
  font-size: 56rpx;
  margin-bottom: 12rpx;
}

.type-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8rpx;
}

.type-desc {
  font-size: 24rpx;
  color: #909399;
}

/* 反馈内容 */
.feedback-content {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
}

.content-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  color: #303133;
}

.char-count {
  font-size: 24rpx;
  color: #909399;
}

.char-count.error {
  color: #f56c6c;
}

.content-textarea {
  width: 100%;
  min-height: 240rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #303133;
}

/* 提交区域 */
.submit-section {
  margin-bottom: 32rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: white;
  border: none;
  margin-bottom: 24rpx;
}

.submit-btn[disabled] {
  background: #c0c4cc;
  opacity: 0.6;
}

.history-link {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28rpx;
  color: #409eff;
  padding: 16rpx;
}

.arrow {
  margin-left: 8rpx;
  font-size: 32rpx;
}

/* 提示信息 */
.tips {
  background: #fff9e6;
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
}

.tip-item {
  font-size: 26rpx;
  color: #e6a23c;
  line-height: 1.8;
  margin-bottom: 8rpx;
}

.tip-item:last-child {
  margin-bottom: 0;
}
</style>
