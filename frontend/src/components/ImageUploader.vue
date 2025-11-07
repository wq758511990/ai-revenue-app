<template>
  <view class="image-uploader">
    <view class="uploader-header">
      <text class="label">
        {{ label }}
      </text>
      <text
        v-if="optional"
        class="optional-tag"
      >
        (可选)
      </text>
      <text class="count-info">
        {{ images.length }}/{{ maxCount }}
      </text>
    </view>

    <view class="uploader-content">
      <!-- 已上传的图片 -->
      <view
        v-for="(image, index) in images"
        :key="index"
        class="image-item"
      >
        <image
          :src="image"
          mode="aspectFill"
          class="image-preview"
          @click="previewImage(index)"
        />
        <view
          class="delete-btn"
          @click="deleteImage(index)"
        >
          <text class="delete-icon">
            ×
          </text>
        </view>
      </view>

      <!-- 上传按钮 -->
      <view
        v-if="images.length < maxCount"
        class="upload-btn"
        @click="chooseImage"
      >
        <text class="upload-icon">
          +
        </text>
        <text class="upload-text">
          添加图片
        </text>
      </view>
    </view>

    <view
      v-if="tip"
      class="uploader-tip"
    >
      <text class="tip-text">
        {{ tip }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { MAX_IMAGES_COUNT, MAX_IMAGE_SIZE, MAX_IMAGE_SIZE_MB } from '@/constants/image.constants';
import { showToast } from '@/utils/toast';
import { ref, watch } from 'vue';

interface Props {
  modelValue?: string[]; // v-model 绑定的图片数组
  label?: string;
  maxCount?: number;
  maxSize?: number; // MB
  optional?: boolean;
  tip?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  label: '上传图片',
  maxCount: MAX_IMAGES_COUNT,
  maxSize: MAX_IMAGE_SIZE_MB,
  optional: true,
  tip: `最多上传${MAX_IMAGES_COUNT}张，每张不超过${MAX_IMAGE_SIZE_MB}MB`,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
  'change': [value: string[]];
}>();

const images = ref<string[]>([...props.modelValue]);

// 监听外部变化
watch(() => props.modelValue, (newVal) => {
  images.value = [...newVal];
});

/**
 * 选择图片
 */
const chooseImage = () => {
  const remainCount = props.maxCount - images.value.length;

  uni.chooseImage({
    count: remainCount,
    sizeType: ['compressed'], // 使用压缩图
    sourceType: ['album', 'camera'], // 相册和拍照
    success: (res) => {
      const tempFilePaths = res.tempFilePaths;
      // 使用 Promise.all 并行处理所有图片
      processImages(tempFilePaths);
    },
    fail: (err) => {
      console.error('选择图片失败:', err);
      showToast('选择图片失败');
    },
  });
};

/**
 * 处理选中的图片
 */
const processImages = async (filePaths: string | string[]) => {
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
  
  uni.showLoading({
    title: '处理图片中...',
    mask: true,
  });

  try {
    for (const filePath of paths) {
      try {
        // 检查文件大小
        const fileInfo = await getFileInfo(filePath);
        if (fileInfo.size > MAX_IMAGE_SIZE) {
          showToast(`图片大小不能超过${props.maxSize}MB`);
          continue;
        }

        // 判断是否为 GIF 动图
        const isGif = filePath.toLowerCase().endsWith('.gif');
        
        let finalPath = filePath;
        if (!isGif) {
          // 非 GIF 图片进行压缩
          finalPath = await compressImage(filePath);
        }
        // GIF 动图不压缩，保持动画效果
        
        // 转换为 base64
        const base64 = await fileToBase64(finalPath);
        
        images.value.push(base64);
      } catch (error) {
        console.error('处理图片失败:', error);
        showToast('图片处理失败');
      }
    }

    // 触发更新
    emitChange();
  } finally {
    uni.hideLoading();
  }
};

/**
 * 压缩图片（GIF 除外）
 */
const compressImage = (filePath: string): Promise<string> => {
  return new Promise((resolve) => {
    uni.compressImage({
      src: filePath,
      quality: 70, // 压缩质量 0-100，70 可以大幅减小体积同时保持质量
      success: (res) => {
        resolve(res.tempFilePath);
      },
      fail: (err) => {
        console.warn('压缩失败，使用原图:', err);
        // 压缩失败则使用原图
        resolve(filePath);
      },
    });
  });
};

/**
 * 获取文件信息
 */
const getFileInfo = (filePath: string): Promise<{ size: number }> => {
  return new Promise((resolve, reject) => {
    uni.getFileInfo({
      filePath,
      success: (res) => {
        resolve({ size: res.size });
      },
      fail: reject,
    });
  });
};

/**
 * 文件转 base64
 */
const fileToBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    uni.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => {
        // 获取文件扩展名
        const ext = filePath.split('.').pop()?.toLowerCase() || 'jpg';
        // 根据扩展名设置正确的 MIME 类型
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'webp') mimeType = 'image/webp';
        
        const base64 = `data:${mimeType};base64,${res.data}`;
        resolve(base64);
      },
      fail: reject,
    });
  });
};

/**
 * 删除图片
 */
const deleteImage = (index: number) => {
  images.value.splice(index, 1);
  emitChange();
};

/**
 * 预览图片
 */
const previewImage = (index: number) => {
  // 过滤掉 data:image 前缀，因为 uni.previewImage 在某些平台不支持
  const urls = images.value.map(img => {
    // 如果是 base64，需要先保存到临时文件
    return img;
  });

  uni.previewImage({
    current: index,
    urls,
  });
};

/**
 * 触发变化事件
 */
const emitChange = () => {
  emit('update:modelValue', images.value);
  emit('change', images.value);
};
</script>

<style lang="scss" scoped>
.image-uploader {
  margin-bottom: 32rpx;
}

.uploader-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;

  .label {
    font-size: 28rpx;
    color: #333333;
    font-weight: 500;
  }

  .optional-tag {
    font-size: 24rpx;
    color: #999999;
    margin-left: 8rpx;
  }

  .count-info {
    margin-left: auto;
    font-size: 24rpx;
    color: #667eea;
    font-weight: 500;
  }
}

.uploader-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;

  .image-preview {
    width: 100%;
    height: 100%;
  }

  .delete-btn {
    position: absolute;
    top: 4rpx;
    right: 4rpx;
    width: 40rpx;
    height: 40rpx;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    .delete-icon {
      color: #ffffff;
      font-size: 32rpx;
      line-height: 1;
    }
  }
}

.upload-btn {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed #d9d9d9;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  transition: all 0.3s ease;

  &:active {
    background: #f0f0f0;
    border-color: #667eea;
  }

  .upload-icon {
    font-size: 48rpx;
    color: #999999;
    line-height: 1;
    margin-bottom: 8rpx;
  }

  .upload-text {
    font-size: 22rpx;
    color: #999999;
  }
}

.uploader-tip {
  margin-top: 12rpx;

  .tip-text {
    font-size: 22rpx;
    color: #999999;
    line-height: 1.6;
  }
}
</style>

