<template>
  <view class="feedback-history-page">
    <!-- 统计信息 -->
    <view
      v-if="stats"
      class="stats-card"
    >
      <view class="stat-item">
        <text class="stat-value">
          {{ stats.total }}
        </text>
        <text class="stat-label">
          总反馈数
        </text>
      </view>
      <view class="stat-item">
        <text class="stat-value">
          {{ stats.byStatus.ADOPTED || 0 }}
        </text>
        <text class="stat-label">
          已采纳
        </text>
      </view>
      <view class="stat-item">
        <text class="stat-value">
          {{ stats.byStatus.REPLIED || 0 }}
        </text>
        <text class="stat-label">
          已回复
        </text>
      </view>
    </view>

    <!-- 筛选器 -->
    <view class="filters">
      <scroll-view
        class="filter-tabs"
        scroll-x
      >
        <view
          v-for="status in statusFilters"
          :key="status.value"
          class="filter-tab"
          :class="{ active: currentStatus === status.value }"
          @click="filterByStatus(status.value)"
        >
          {{ status.label }}
        </view>
      </scroll-view>
    </view>

    <!-- 反馈列表 -->
    <view class="feedback-list">
      <view
        v-for="feedback in feedbacks"
        :key="feedback.id"
        class="feedback-item"
        @click="viewDetail(feedback)"
      >
        <view class="feedback-header">
          <view class="feedback-type">
            <text class="type-icon">
              {{ getTypeIcon(feedback.feedbackType) }}
            </text>
            <text class="type-name">
              {{ getTypeName(feedback.feedbackType) }}
            </text>
          </view>
          <view
            class="feedback-status"
            :style="{ color: getStatusColor(feedback.status) }"
          >
            {{ getStatusName(feedback.status) }}
          </view>
        </view>

        <view class="feedback-content">
          {{ feedback.content }}
        </view>

        <view
          v-if="feedback.adminReply"
          class="admin-reply"
        >
          <view class="reply-label">
            官方回复：
          </view>
          <view class="reply-content">
            {{ feedback.adminReply }}
          </view>
        </view>

        <view class="feedback-footer">
          <text class="feedback-time">
            {{ formatTime(feedback.createdAt) }}
          </text>
          <text
            v-if="feedback.repliedAt"
            class="reply-time"
          >
            回复于 {{ formatTime(feedback.repliedAt) }}
          </text>
        </view>
      </view>

      <!-- 空状态 -->
      <view
        v-if="!loading && feedbacks.length === 0"
        class="empty-state"
      >
        <text class="empty-icon">
          📝
        </text>
        <text class="empty-text">
          暂无反馈记录
        </text>
        <button
          class="submit-feedback-btn"
          @click="goToSubmit"
        >
          提交反馈
        </button>
      </view>

      <!-- 加载更多 -->
      <view
        v-if="hasMore"
        class="load-more"
        @click="loadMore"
      >
        <text>{{ loading ? '加载中...' : '加载更多' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {
    feedbackStatusColors,
    feedbackStatusNames,
    feedbackTypeNames,
    getFeedbackStats,
    getUserFeedbacks,
    type Feedback,
    type FeedbackStats,
    type FeedbackStatus,
} from '@/api/feedback';
import { onMounted, ref } from 'vue';

// 状态过滤选项
const statusFilters = [
  { value: '', label: '全部' },
  { value: 'SUBMITTED', label: '已提交' },
  { value: 'IN_PROGRESS', label: '处理中' },
  { value: 'REPLIED', label: '已回复' },
  { value: 'ADOPTED', label: '已采纳' },
];

// 状态
const feedbacks = ref<Feedback[]>([]);
const stats = ref<FeedbackStats | null>(null);
const currentStatus = ref<FeedbackStatus | ''>('');
const loading = ref(false);
const page = ref(1);
const hasMore = ref(true);

// 获取反馈统计
const loadStats = async () => {
  try {
    const result = await getFeedbackStats();
    stats.value = result;
  } catch (error) {
    console.error('Failed to load stats', error);
  }
};

// 加载反馈列表
const loadFeedbacks = async (reset = false) => {
  if (loading.value) return;

  try {
    loading.value = true;
    if (reset) {
      page.value = 1;
      feedbacks.value = [];
    }

    // 构建查询参数，不传空值
    const params: any = {
      page: page.value,
      limit: 20,
    };
    
    // 只有当状态有值时才添加到参数中
    if (currentStatus.value) {
      params.status = currentStatus.value;
    }
    
    const result = await getUserFeedbacks(params);

    if (reset) {
      feedbacks.value = result.feedbacks;
    } else {
      feedbacks.value.push(...result.feedbacks);
    }

    hasMore.value = page.value < result.totalPages;
  } catch (error: any) {
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  page.value++;
  loadFeedbacks(false);
};

// 按状态筛选
const filterByStatus = (status: FeedbackStatus | '') => {
  currentStatus.value = status;
  loadFeedbacks(true);
};

// 查看详情
const viewDetail = (feedback: Feedback) => {
  // 如果有回复，显示详情弹窗
  if (feedback.adminReply) {
    uni.showModal({
      title: '反馈详情',
      content: `您的反馈：\n${feedback.content}\n\n官方回复：\n${feedback.adminReply}`,
      showCancel: false,
      confirmText: '知道了',
    });
  }
};

// 获取类型图标
const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    NEW_TONE: '🎨',
    NEW_SCENARIO: '📝',
    FEATURE_REQUEST: '💡',
    BUG_REPORT: '🐛',
  };
  return icons[type] || '📝';
};

// 获取类型名称
const getTypeName = (type: string) => {
  return feedbackTypeNames[type as keyof typeof feedbackTypeNames] || type;
};

// 获取状态名称
const getStatusName = (status: FeedbackStatus) => {
  return feedbackStatusNames[status];
};

// 获取状态颜色
const getStatusColor = (status: FeedbackStatus) => {
  return feedbackStatusColors[status];
};

// 格式化时间
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
};

// 跳转到提交页面
const goToSubmit = () => {
  uni.navigateBack();
};

// 初始化
onMounted(() => {
  loadStats();
  loadFeedbacks(true);
});
</script>

<style scoped>
.feedback-history-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 统计卡片 */
.stats-card {
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 32rpx;
  margin-bottom: 24rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 8rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 筛选器 */
.filters {
  background: white;
  padding: 24rpx 0;
  margin-bottom: 24rpx;
}

.filter-tabs {
  white-space: nowrap;
  padding: 0 32rpx;
}

.filter-tab {
  display: inline-block;
  padding: 12rpx 32rpx;
  margin-right: 16rpx;
  font-size: 28rpx;
  color: #606266;
  background: #f5f7fa;
  border-radius: 32rpx;
  transition: all 0.3s;
}

.filter-tab.active {
  color: white;
  background: #409eff;
}

/* 反馈列表 */
.feedback-list {
  padding: 0 32rpx 32rpx;
}

.feedback-item {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.feedback-type {
  display: flex;
  align-items: center;
}

.type-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.type-name {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
}

.feedback-status {
  font-size: 24rpx;
  font-weight: 500;
}

.feedback-content {
  font-size: 28rpx;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.admin-reply {
  background: #f0f9ff;
  border-left: 4rpx solid #409eff;
  padding: 16rpx;
  margin-bottom: 16rpx;
  border-radius: 8rpx;
}

.reply-label {
  font-size: 24rpx;
  color: #409eff;
  margin-bottom: 8rpx;
}

.reply-content {
  font-size: 26rpx;
  color: #606266;
  line-height: 1.5;
}

.feedback-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
  color: #909399;
}

.reply-time {
  color: #67c23a;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 120rpx 32rpx;
}

.empty-icon {
  display: block;
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  display: block;
  font-size: 28rpx;
  color: #909399;
  margin-bottom: 40rpx;
}

.submit-feedback-btn {
  width: 320rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 32rpx;
  font-size: 28rpx;
  color: #909399;
}
</style>

