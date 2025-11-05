<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('App Launch');
  // 初始化用户信息
  const userStore = useUserStore();
  userStore.initUser();
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style lang="scss">
/* 全局样式 */
page {
  background-color: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
}

/* 通用样式 */
.container {
  padding: 30rpx;
}

.flex-row {
  display: flex;
  flex-direction: row;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-primary {
  color: #007aff;
}

.text-secondary {
  color: #666;
}

.text-error {
  color: #f56c6c;
}

.text-success {
  color: #67c23a;
}
</style>

