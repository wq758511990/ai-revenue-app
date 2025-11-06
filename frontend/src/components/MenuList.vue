<template>
  <view class="menu-section">
    <view
      v-for="item in items"
      :key="item.id"
      class="menu-item"
      @click="handleClick(item)"
    >
      <view class="menu-left">
        <text class="menu-icon">
          {{ item.icon }}
        </text>
        <text class="menu-label">
          {{ item.label }}
        </text>
      </view>
      <text class="menu-arrow">
        ›
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  onClick?: () => void;
}

interface Props {
  items: MenuItem[];
}

const props = defineProps<Props>();

const handleClick = (item: MenuItem) => {
  if (item.onClick) {
    item.onClick();
  }
};
</script>

<style scoped>
.menu-section {
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 2rpx solid #f5f5f5;
  transition: background 0.2s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background: #f5f5f5;
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
}

.menu-label {
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 48rpx;
  color: #ccc;
}
</style>

