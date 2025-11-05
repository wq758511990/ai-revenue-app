<template>
  <view class="generate-page">
    <view class="header">
      <text class="page-title">
        {{ scenario?.name || '生成文案' }}
      </text>
      <text
        v-if="scenario?.description"
        class="page-desc"
      >
        {{ scenario.description }}
      </text>
    </view>

    <view class="content">
      <!-- 动态表单 -->
      <view class="form-section">
        <view
          v-for="field in formFields"
          :key="field.name"
          class="form-item"
        >
          <view class="label">
            {{ field.label }}
            <text
              v-if="field.required"
              class="required"
            >
              *
            </text>
          </view>
          
          <input
            v-if="field.type === 'text'"
            v-model="formData[field.name]"
            class="input"
            :placeholder="field.placeholder || `请输入${field.label}`"
          >

          <textarea
            v-else-if="field.type === 'textarea'"
            v-model="formData[field.name]"
            class="textarea"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :maxlength="field.maxLength || MAX_CONTENT_LENGTH"
            :show-confirm-bar="false"
          />

          <picker
            v-else-if="field.type === 'select'"
            :range="field.options"
            @change="handlePickerChange($event, field.name)"
          >
            <view
              class="picker"
              :class="{ 'picker-empty': !formData[field.name] }"
            >
              {{ formData[field.name] || `请选择${field.label}` }}
              <text class="picker-arrow">
                ▼
              </text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 情绪风格选择 -->
      <view class="tone-section">
        <ToneSelector
          v-model="selectedToneStyle"
          :tone-styles="toneStylesWithIcon"
          :show-suggest="true"
          @suggest="handleSuggestTone"
        />
      </view>

      <!-- 生成按钮 -->
      <button 
        class="generate-btn" 
        :loading="generating" 
        :disabled="generating"
        @click="handleGenerate"
      >
        {{ generating ? '生成中...' : '✨ 生成文案' }}
      </button>

      <!-- 上次生成记录提示 -->
      <view
        v-if="lastGeneratedId"
        class="tip-section"
      >
        <text class="tip-text">
          💡 可直接重新生成或切换风格
        </text>
      </view>
    </view>

    <!-- 加载状态 -->
    <Loading
      :visible="loading"
      text="加载配置中..."
    />
  </view>
</template>

<script setup lang="ts">
import Loading from '@/components/Loading.vue';
import ToneSelector from '@/components/ToneSelector.vue';
import { useScenarioStore } from '@/stores/scenario';
import { get, post } from '@/utils/request';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref, watch } from 'vue';
import { showError, showToast, showLongToast } from '@/utils/toast';
import { MAX_CONTENT_LENGTH, TONE_STYLE_ICONS } from '@/constants/ui.constants';

const scenarioStore = useScenarioStore();
const scenario = computed(() => scenarioStore.currentScenario);

const formFields = ref<any[]>([]);
const formData = ref<Record<string, any>>({});
const toneStyles = ref<any[]>([]);
const selectedToneStyle = ref('');
const defaultToneStyle = ref('');
const generating = ref(false);
const loading = ref(true);
const lastGeneratedId = ref('');

let scenarioSlug = '';
let isReturningFromResult = false;

// 带图标的情绪风格列表
const toneStylesWithIcon = computed(() => {
  return toneStyles.value.map(tone => ({
    ...tone,
    icon: TONE_STYLE_ICONS[tone.slug] || '📝',
  }));
});

onLoad((options: any) => {
  scenarioSlug = options.slug;
  isReturningFromResult = options.fromResult === 'true';
  
  initPage();
});

onShow(() => {
  // 如果是从结果页返回，保持当前表单数据和风格
  if (!isReturningFromResult) {
    // 正常进入页面，重置数据
    formData.value = {};
  }
  isReturningFromResult = false;
});

const initPage = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadScenarioData(),
      loadToneStyles(),
    ]);
  } finally {
    loading.value = false;
  }
};

const loadScenarioData = async () => {
  try {
    const data = await get(`/scenarios/${scenarioSlug}`, undefined, false);
    scenarioStore.setCurrentScenario(data);
    
    if (data.inputSchema && data.inputSchema.fields) {
      formFields.value = data.inputSchema.fields;
      
      // 初始化表单数据
      formFields.value.forEach((field: any) => {
        if (!formData.value[field.name]) {
          formData.value[field.name] = '';
        }
      });
    }

    // 保存默认风格
    defaultToneStyle.value = data.defaultToneStyle || 'ENTHUSIASTIC';
    
    // 如果还没有选择风格，使用默认风格
    if (!selectedToneStyle.value) {
      selectedToneStyle.value = defaultToneStyle.value;
    }
  } catch (error: any) {
    showError(error.message || '加载场景失败');
  }
};

const loadToneStyles = async () => {
  try {
    const data = await get('/tone-styles', undefined, false);
    toneStyles.value = data;
  } catch (error) {
    console.error('加载情绪风格失败:', error);
    // 使用默认风格列表
    toneStyles.value = [
      { id: '1', name: '热情洋溢', slug: 'ENTHUSIASTIC', description: '充满活力和激情' },
      { id: '2', name: '专业严谨', slug: 'PROFESSIONAL', description: '正式、专业、可信' },
      { id: '3', name: '轻松幽默', slug: 'HUMOROUS', description: '风趣幽默、轻松愉快' },
      { id: '4', name: '温柔亲和', slug: 'GENTLE', description: '温暖、亲切、有同理心' },
      { id: '5', name: '简洁直接', slug: 'CONCISE', description: '直截了当、简明扼要' },
    ];
  }
};

const handlePickerChange = (e: any, fieldName: string) => {
  const index = e.detail.value;
  const field = formFields.value.find(f => f.name === fieldName);
  if (field && field.options) {
    formData.value[fieldName] = field.options[index];
  }
};

// 监听场景变化，重置风格为默认值 (T085)
watch(() => scenarioSlug, () => {
  if (defaultToneStyle.value) {
    selectedToneStyle.value = defaultToneStyle.value;
  }
});

const handleGenerate = async () => {
  // 验证必填字段
  for (const field of formFields.value) {
    if (field.required && !formData.value[field.name]) {
      showToast(`请填写${field.label}`);
      return;
    }
  }

  if (!selectedToneStyle.value) {
    showToast('请选择情绪风格');
    return;
  }

  try {
    generating.value = true;

    const result = await post<{ id: string; content: string }>('/content/generate', {
      scenarioSlug,
      toneStyle: selectedToneStyle.value,
      userInput: formData.value,
    });

    if (result && result.id) {
      lastGeneratedId.value = result.id;
      
      // 跳转到结果页 (T086: 保持风格，通过query传递)
      uni.navigateTo({
        url: `/pages/result/result?id=${result.id}&keepStyle=true`,
      });
    } else {
      throw new Error('生成失败');
    }
  } catch (error: any) {
    console.error('生成文案失败:', error);
    showLongToast(error.message || '生成失败，请重试');
  } finally {
    generating.value = false;
  }
};

const handleSuggestTone = () => {
  uni.navigateTo({
    url: '/pages-sub/profile/feedback?type=NEW_TONE',
  });
};
</script>

<style lang="scss" scoped>
.generate-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx 40rpx;
  text-align: center;

  .page-title {
    display: block;
    font-size: 40rpx;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 12rpx;
  }

  .page-desc {
    display: block;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.content {
  padding: 32rpx;
}

.form-section {
  margin-bottom: 32rpx;
}

.form-item {
  margin-bottom: 32rpx;

  .label {
    display: flex;
    align-items: center;
    font-size: 28rpx;
    color: #333333;
    font-weight: 500;
    margin-bottom: 16rpx;

    .required {
      color: #ff4d4f;
      margin-left: 4rpx;
    }
  }

  .input {
    width: 100%;
    height: 80rpx;
    padding: 0 24rpx;
    background: #ffffff;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333333;
    border: 2rpx solid #e8e8e8;
    box-sizing: border-box;
    transition: border-color 0.3s ease;

    &:focus {
      border-color: #667eea;
    }
  }

  .textarea {
    width: 100%;
    padding: 24rpx;
    background: #ffffff;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333333;
    border: 2rpx solid #e8e8e8;
    box-sizing: border-box;
    transition: border-color 0.3s ease;
    min-height: 200rpx;
    line-height: 1.6;

    &:focus {
      border-color: #667eea;
    }
  }

  .picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 24rpx;
    background: #ffffff;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333333;
    border: 2rpx solid #e8e8e8;
    box-sizing: border-box;

    &.picker-empty {
      color: #999999;
    }

    .picker-arrow {
      font-size: 20rpx;
      color: #999999;
      margin-left: 16rpx;
    }
  }
}

.tone-section {
  margin-bottom: 40rpx;
}

.generate-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;

  &:active:not([disabled]) {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
  }

  &[disabled] {
    opacity: 0.6;
  }
}

.tip-section {
  margin-top: 24rpx;
  padding: 24rpx;
  background: #fff7e6;
  border-radius: 12rpx;
  border-left: 4rpx solid #ffa940;

  .tip-text {
    font-size: 24rpx;
    color: #d48806;
    line-height: 1.6;
  }
}
</style>
