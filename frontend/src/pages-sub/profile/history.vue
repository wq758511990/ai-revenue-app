<template>
  <view class="history-page">
    <!-- 统计卡片 -->
    <view v-if="stats" class="stats-section">
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-value">{{ stats.totalCount }}</text>
          <text class="stat-label">总生成</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.recentCount }}</text>
          <text class="stat-label">近7天</text>
        </view>
      </view>
    </view>

    <!-- 历史记录列表 -->
    <view class="history-list">
      <view
        v-for="record in records"
        :key="record.id"
        class="history-card"
        @click="viewDetail(record)"
      >
        <view class="card-header">
          <view class="scenario-info">
            <text class="scenario-name">{{ record.scenario?.name }}</text>
            <text class="scenario-platform">{{ record.scenario?.platform }}</text>
          </view>
          <view class="tone-style-badge" :style="getToneStyleColor(record.toneStyle)">
            {{ getToneStyleName(record.toneStyle) }}
          </view>
        </view>

        <!-- 编辑模式 -->
        <view v-if="editingRecordId === record.id" class="edit-mode">
          <view class="edit-label">临时编辑（不会保存）</view>
          <textarea
            v-model="editingContent"
            class="edit-textarea"
            :auto-height="true"
            :maxlength="MAX_CONTENT_LENGTH"
            :show-confirm-bar="false"
          />
          <view class="edit-actions">
            <button class="edit-btn cancel" @click.stop="handleCancelEdit">取消</button>
            <button class="edit-btn copy" @click.stop="handleCopyEdited">复制</button>
          </view>
        </view>

        <!-- 查看模式 -->
        <view v-else>
          <view class="card-content">
            <text class="content-text">
              {{ getDisplayContent(record) }}
            </text>
          </view>

          <view class="card-footer">
            <text class="time-text">{{ formatTime(record.createdAt) }}</text>
            <view class="actions">
              <view class="action-btn" @click.stop="handleEdit(record)">
                <text class="action-icon">✏️</text>
                <text class="action-text">编辑</text>
              </view>
              <view class="action-btn" @click.stop="handleCopy(record)">
                <text class="action-icon">📋</text>
                <text class="action-text">复制</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && records.length === 0" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">还没有生成过文案</text>
        <button class="go-generate-btn" @click="goToGenerate">开始创作</button>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore" class="load-more" @click="loadMore">
        <text>{{ loading ? '加载中...' : '加载更多' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiContent } from '@/api/content';
import { copyToClipboard } from '@/utils/clipboard';
import { showError, showToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/time';
import { 
  DEFAULT_PAGE_SIZE, 
  MAX_CONTENT_LENGTH,
  TONE_STYLE_NAMES,
  TONE_STYLE_COLORS 
} from '@/constants/ui.constants';

interface ContentRecord {
  id: string;
  scenarioId: string;
  toneStyle: string;
  userInput: Record<string, any>;
  generatedContent: string;
  isEdited: boolean;
  editedContent?: string;
  createdAt: string;
  scenario?: {
    name: string;
    slug: string;
    platform: string;
  };
}

interface HistoryStats {
  totalCount: number;
  recentCount: number;
  scenarioStats: Array<{ scenarioId: string; count: number }>;
  toneStyleStats: Array<{ toneStyle: string; count: number }>;
}

// 状态
const records = ref<ContentRecord[]>([]);
const stats = ref<HistoryStats | null>(null);
const loading = ref(false);
const page = ref(1);
const hasMore = ref(true);
const editingRecordId = ref<string | null>(null);
const editingContent = ref('');

// 加载统计数据
const loadStats = async () => {
  try {
    const result = await apiContent.getUserStats();
    stats.value = result;
  } catch (error) {
    console.error('Failed to load stats', error);
  }
};

// 加载历史记录
const loadHistory = async (reset = false) => {
  if (loading.value) return;

  try {
    loading.value = true;
    if (reset) {
      page.value = 1;
      records.value = [];
    }

    const result = await apiContent.getHistory(page.value, DEFAULT_PAGE_SIZE);
    const newRecords = result.records || [];

    if (reset) {
      records.value = newRecords;
    } else {
      records.value.push(...newRecords);
    }

    hasMore.value = page.value < result.totalPages;
  } catch (error: any) {
    showError(error.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  page.value++;
  loadHistory(false);
};

// 查看详情
const viewDetail = (record: ContentRecord) => {
  // 如果正在编辑，不触发跳转
  if (editingRecordId.value) return;
  
  // 以只读模式打开详情页
  uni.navigateTo({
    url: `/pages/result/result?id=${record.id}&readonly=true`,
  });
};

// 开始编辑（临时编辑，不保存）
const handleEdit = (record: ContentRecord) => {
  editingRecordId.value = record.id;
  editingContent.value = getDisplayContent(record);
};

// 取消编辑
const handleCancelEdit = () => {
  editingRecordId.value = null;
  editingContent.value = '';
};

// 复制编辑后的内容
const handleCopyEdited = () => {
  if (!editingContent.value.trim()) {
    showToast('内容为空');
    return;
  }
  
  copyToClipboard(editingContent.value);
  // 复制后退出编辑模式
  editingRecordId.value = null;
  editingContent.value = '';
};

// 复制文案
const handleCopy = (record: ContentRecord) => {
  const content = getDisplayContent(record);
  copyToClipboard(content);
};

// 获取显示内容
const getDisplayContent = (record: ContentRecord) => {
  return record.isEdited && record.editedContent
    ? record.editedContent
    : record.generatedContent;
};

// 获取情绪风格名称
const getToneStyleName = (toneStyle: string) => {
  return TONE_STYLE_NAMES[toneStyle] || toneStyle;
};

// 获取情绪风格颜色
const getToneStyleColor = (toneStyle: string) => {
  return TONE_STYLE_COLORS[toneStyle] || TONE_STYLE_COLORS.ENTHUSIASTIC;
};

// 格式化时间（使用工具函数）
const formatTime = (dateString: string) => {
  return formatRelativeTime(dateString);
};

// 跳转到生成页面
const goToGenerate = () => {
  uni.switchTab({
    url: '/pages/index/index',
  });
};

// 初始化
onMounted(() => {
  loadStats();
  loadHistory(true);
});
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 统计卡片 */
.stats-section {
  padding: 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-card {
  display: flex;
  gap: 32rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  backdrop-filter: blur(10rpx);
}

.stat-value {
  display: block;
  font-size: 56rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 8rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 历史记录列表 */
.history-list {
  padding: 32rpx;
}

.history-card {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
}

.history-card:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.scenario-info {
  display: flex;
  flex-direction: column;
}

.scenario-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8rpx;
}

.scenario-platform {
  font-size: 24rpx;
  color: #909399;
}

.tone-style-badge {
  padding: 8rpx 20rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: white;
}

.card-content {
  margin-bottom: 16rpx;
}

.content-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  font-size: 28rpx;
  line-height: 1.6;
  color: #606266;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #e4e7ed;
}

.time-text {
  font-size: 24rpx;
  color: #909399;
}

.actions {
  display: flex;
  gap: 24rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: #f5f7fa;
  border-radius: 32rpx;
  font-size: 24rpx;
  color: #606266;
  transition: all 0.3s;
}

.action-btn:active {
  opacity: 0.7;
  transform: scale(0.95);
}

.action-icon {
  font-size: 24rpx;
}

.action-text {
  font-size: 24rpx;
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

.go-generate-btn {
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

/* 编辑模式 */
.edit-mode {
  padding: 24rpx 0;
}

.edit-label {
  font-size: 24rpx;
  color: #e6a23c;
  margin-bottom: 16rpx;
  padding-left: 8rpx;
  border-left: 4rpx solid #e6a23c;
}

.edit-textarea {
  width: 100%;
  min-height: 300rpx;
  max-height: 800rpx;
  padding: 16rpx;
  background: #f9fafb;
  border-radius: 8rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 16rpx;
  border: 2rpx solid #e4e7ed;
}

.edit-actions {
  display: flex;
  gap: 16rpx;
  justify-content: flex-end;
}

.edit-btn {
  padding: 16rpx 32rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  border: none;
  line-height: 1;
}

.edit-btn.cancel {
  background: #f5f7fa;
  color: #606266;
}

.edit-btn.copy {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.edit-btn:active {
  opacity: 0.8;
}
</style>
