<template>
  <view class="content-editor">
    <view class="editor-header">
      <text class="editor-title">编辑文案</text>
      <text class="editor-hint">{{ charCount }}/{{ maxLength }}</text>
    </view>

    <textarea
      class="editor-textarea"
      v-model="localContent"
      :maxlength="maxLength"
      :placeholder="placeholder"
      :auto-height="autoHeight"
      @input="handleInput"
    />

    <view class="editor-actions">
      <button class="action-btn cancel" @click="handleCancel">取消</button>
      <button class="action-btn save" @click="handleSave" :disabled="!isModified || saving">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  content: string;
  maxLength?: number;
  placeholder?: string;
  autoHeight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  maxLength: 2000,
  placeholder: '请输入文案内容...',
  autoHeight: true,
});

const emit = defineEmits<{
  (e: 'save', content: string): void;
  (e: 'cancel'): void;
}>();

// 状态
const localContent = ref(props.content);
const saving = ref(false);

// 计算属性
const charCount = computed(() => localContent.value.length);

const isModified = computed(() => {
  return localContent.value.trim() !== props.content.trim();
});

// 方法
const handleInput = (e: any) => {
  localContent.value = e.detail.value;
};

const handleSave = () => {
  if (!isModified.value || saving.value) return;

  const trimmedContent = localContent.value.trim();
  if (!trimmedContent) {
    uni.showToast({
      title: '内容不能为空',
      icon: 'none',
    });
    return;
  }

  emit('save', trimmedContent);
};

const handleCancel = () => {
  if (isModified.value) {
    uni.showModal({
      title: '提示',
      content: '是否放弃编辑？',
      success: (res) => {
        if (res.confirm) {
          emit('cancel');
        }
      },
    });
  } else {
    emit('cancel');
  }
};

// 监听 content 变化
watch(
  () => props.content,
  (newVal) => {
    localContent.value = newVal;
  }
);
</script>

<style scoped>
.content-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.editor-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.editor-hint {
  font-size: 24rpx;
  color: #999;
}

.editor-textarea {
  flex: 1;
  padding: 32rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
  min-height: 400rpx;
}

.editor-actions {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 32rpx;
  background: #ffffff;
  border-top: 2rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
}

.action-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.action-btn.cancel:active {
  background: #e8e8e8;
}

.action-btn.save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.action-btn.save:disabled {
  opacity: 0.5;
}

.action-btn.save:active:not(:disabled) {
  opacity: 0.8;
}
</style>

