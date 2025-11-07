/**
 * 图片相关常量
 */

// 图片上传限制
export const MAX_IMAGES_COUNT = 9; // 最多上传9张图片
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 每张图片最大2MB
export const MAX_IMAGE_SIZE_MB = 2; // 用于显示

// 支持的图片格式
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// 图片识别提示语
export const IMAGE_RECOGNITION_PROMPTS = {
  DEFAULT: '请详细描述这张图片的内容，包括：主要物体、场景、氛围、色彩等。用简洁专业的语言描述，不超过200字。',
  PRODUCT: '请描述图片中的商品特征、外观、风格和特点。',
  SCENE: '请描述图片中的场景、环境、氛围和整体感觉。',
  TEXT: '请提取图片中的所有文字内容。',
};

