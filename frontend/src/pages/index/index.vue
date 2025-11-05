<template>
  <view class="index-page">
    <!-- 头部 -->
    <view class="header">
      <text class="title">AI文案助手</text>
      <text class="subtitle">12种场景，5种风格，一键生成专业文案</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input
          v-model="searchKeyword"
          placeholder="搜索场景..."
          @input="handleSearch"
          class="input"
          placeholder-class="placeholder"
        />
        <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">✕</text>
      </view>
    </view>

    <!-- 平台分类 -->
    <view class="category-tabs">
      <scroll-view scroll-x class="scroll-view">
        <view
          v-for="category in categories"
          :key="category"
          class="category-tab"
          :class="{ active: selectedCategory === category }"
          @click="selectCategory(category)"
        >
          <text class="tab-text">{{ category }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 场景列表 -->
    <view class="scenarios-container">
      <view v-if="loading" class="loading-state">
        <Loading :visible="true" text="加载中..." :fullscreen="false" />
      </view>

      <view v-else-if="filteredScenarios.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">没有找到相关场景</text>
        <text class="empty-hint">试试其他关键词或分类</text>
      </view>

      <view v-else class="scenario-list">
        <ScenarioCard
          v-for="scenario in filteredScenarios"
          :key="scenario.id"
          :scenario="scenario"
          @click="handleSelectScenario"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useScenarioStore } from '@/stores/scenario';
import ScenarioCard from '@/components/ScenarioCard.vue';
import Loading from '@/components/Loading.vue';

const scenarioStore = useScenarioStore();

const scenarios = computed(() => scenarioStore.scenarios);
const loading = computed(() => scenarioStore.loading);

// 搜索关键词
const searchKeyword = ref('');

// 选中的分类
const selectedCategory = ref('全部');

// 分类列表（基于平台自动生成）
const categories = computed(() => {
  const platforms = new Set<string>();
  scenarios.value.forEach((s: any) => {
    if (s.platform) {
      platforms.add(s.platform);
    }
  });
  return ['全部', ...Array.from(platforms).sort()];
});

// 过滤后的场景列表
const filteredScenarios = computed(() => {
  let filtered = scenarios.value;

  // 按分类过滤
  if (selectedCategory.value !== '全部') {
    filtered = filtered.filter((s: any) => s.platform === selectedCategory.value);
  }

  // 按搜索关键词过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase();
    filtered = filtered.filter((s: any) => {
      return (
        s.name.toLowerCase().includes(keyword) ||
        s.description.toLowerCase().includes(keyword) ||
        s.platform.toLowerCase().includes(keyword)
      );
    });
  }

  return filtered;
});

// 生命周期
onMounted(async () => {
  await scenarioStore.fetchScenarios();
});

// 处理搜索输入
const handleSearch = () => {
  // 搜索时自动重置分类为"全部"
  if (searchKeyword.value.trim()) {
    selectedCategory.value = '全部';
  }
};

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = '';
};

// 选择分类
const selectCategory = (category: string) => {
  selectedCategory.value = category;
  // 切换分类时清空搜索
  searchKeyword.value = '';
};

// 选择场景
const handleSelectScenario = (scenario: any) => {
  scenarioStore.setCurrentScenario(scenario);
  uni.navigateTo({
    url: `/pages/generate/generate?slug=${scenario.slug}`,
  });
};
</script>

<style lang="scss" scoped>
.index-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 0 80rpx;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
  padding: 40rpx 30rpx 0;

  .title {
    display: block;
    font-size: 48rpx;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 16rpx;
  }

  .subtitle {
    display: block;
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.search-bar {
  padding: 0 30rpx 24rpx;

  .search-input {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 48rpx;
    padding: 20rpx 32rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

    .search-icon {
      font-size: 32rpx;
      margin-right: 16rpx;
    }

    .input {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }

    .placeholder {
      color: #999;
    }

    .clear-icon {
      font-size: 32rpx;
      color: #999;
      padding: 0 8rpx;
    }
  }
}

.category-tabs {
  padding: 0 0 24rpx;
  
  .scroll-view {
    white-space: nowrap;
    padding: 0 30rpx;
  }

  .category-tab {
    display: inline-block;
    padding: 16rpx 32rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 48rpx;
    margin-right: 16rpx;
    transition: all 0.3s ease;

    &.active {
      background: rgba(255, 255, 255, 0.95);

      .tab-text {
        color: #667eea;
        font-weight: 600;
      }
    }

    .tab-text {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.9);
      white-space: nowrap;
    }
  }
}

.scenarios-container {
  padding: 0 30rpx;
}

.loading-state {
  padding: 120rpx 0;
  display: flex;
  justify-content: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;

  .empty-icon {
    font-size: 96rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: 32rpx;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 12rpx;
  }

  .empty-hint {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.6);
  }
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
</style>
