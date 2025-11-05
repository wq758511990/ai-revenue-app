<template>
  <view class="result-page">
    <view class="header">
      <text class="title">{{ isEditing ? '编辑文案' : '生成结果' }}</text>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else-if="record" class="content-container">
      <!-- 查看模式 -->
      <view v-if="!isEditing" class="content-box">
        <view class="content-header">
          <text class="label">文案内容</text>
          <view class="header-right">
            <text v-if="record.isEdited" class="edited-badge">已编辑</text>
            <text class="meta">{{ record.generationTime }}ms</text>
          </view>
        </view>
        <view class="content-text">
          {{ displayContent }}
        </view>
      </view>

      <!-- 编辑模式 -->
      <view v-else class="editor-container">
        <ContentEditor
          :content="displayContent"
          @save="handleSave"
          @cancel="handleCancelEdit"
        />
      </view>

      <!-- 操作按钮 -->
      <view v-if="!isEditing" class="actions">
        <!-- 只读模式（从历史记录进入）：只显示复制按钮 -->
        <button v-if="isReadonly" class="action-btn primary full-width" @click="handleCopy">
          <text>复制文案</text>
        </button>
        
        <!-- 正常模式（从生成页进入）：显示所有操作 -->
        <template v-else>
        <button class="action-btn primary" @click="handleCopy">
          <text>复制文案</text>
        </button>
        <button class="action-btn secondary" @click="handleEdit">
          <text>编辑</text>
        </button>
        <button class="action-btn secondary" @click="handleRegenerate">
          <text>重新生成</text>
        </button>
        </template>
      </view>

      <!-- 信息区域 -->
      <view v-if="!isEditing" class="info-section">
        <view class="info-item">
          <text class="info-label">场景：</text>
          <text class="info-value">{{ record.scenario?.name }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">情绪风格：</text>
          <text class="info-value">{{ record.toneStyle }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { apiContent } from '@/api/content';
import { copyToClipboard } from '@/utils/clipboard';
import ContentEditor from '@/components/ContentEditor.vue';
import { showError, showSuccess, withLoading } from '@/utils/toast';

const record = ref<any>(null);
const loading = ref(true);
const isEditing = ref(false);
const isReadonly = ref(false);

let recordId = '';

onLoad((options: any) => {
  recordId = options.id;
  // 检查是否为只读模式（从历史记录进入）
  isReadonly.value = options.readonly === 'true';
  loadRecord();
});

const displayContent = computed(() => {
  if (!record.value) return '';
  return record.value.isEdited ? record.value.editedContent : record.value.generatedContent;
});

const loadRecord = async () => {
  try {
    loading.value = true;
    const data = await apiContent.getById(recordId);
    record.value = data;
  } catch (error: any) {
    showError(error.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

const handleCopy = async () => {
  try {
    await copyToClipboard(displayContent.value);
  } catch (error: any) {
    showError(error.message || '复制失败');
  }
};

const handleEdit = () => {
  isEditing.value = true;
};

const handleCancelEdit = () => {
  isEditing.value = false;
};

const handleSave = async (editedContent: string) => {
  try {
    await withLoading(
      '保存中...',
      async () => {
        await apiContent.editContent(recordId, editedContent);
      },
      {
        successText: '保存成功',
        errorText: '保存失败',
        showSuccessToast: true,
      }
    );

    isEditing.value = false;

    // 重新加载记录
    await loadRecord();
  } catch (error) {
    // 错误已在 withLoading 中处理
  }
};

const handleRegenerate = () => {
  uni.navigateBack({
    delta: 1,
  });
};
</script>

<style lang="scss" scoped>
.result-page {
  min-height: 100vh;
  background: #f8f8f8;
}

.header {
  background: #667eea;
  padding: 40rpx 30rpx;
  text-align: center;

  .title {
    font-size: 36rpx;
    font-weight: 600;
    color: #ffffff;
  }
}

.loading {
  text-align: center;
  padding: 120rpx 0;
  color: #999;
  font-size: 28rpx;
}

.content-container {
  padding: 30rpx;
}

.content-box {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .label {
      font-size: 28rpx;
      font-weight: 600;
      color: #333;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16rpx;
    }

    .edited-badge {
      padding: 4rpx 12rpx;
      background: #52c41a;
      border-radius: 8rpx;
      font-size: 20rpx;
      color: #ffffff;
    }

    .meta {
      font-size: 24rpx;
      color: #999;
    }
  }

  .content-text {
    font-size: 30rpx;
    line-height: 1.8;
    color: #333;
    white-space: pre-wrap;
  }
}

.editor-container {
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  min-height: 600rpx;
}

.actions {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;

  .action-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 500;
    border: none;

    &.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
    }

    &.secondary {
      background: #ffffff;
      color: #667eea;
      border: 2rpx solid #667eea;
    }
    
    &.full-width {
      flex: none;
      width: 100%;
    }
  }
}

.info-section {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 32rpx;

  .info-item {
    display: flex;
    margin-bottom: 16rpx;
    font-size: 28rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .info-label {
      color: #999;
      margin-right: 16rpx;
    }

    .info-value {
      color: #333;
      font-weight: 500;
    }
  }
}
</style>

