/**
 * UI 相关常量
 */

// 请求超时配置
export const REQUEST_TIMEOUT = 60000; // 60秒

// Toast 配置
export const TOAST_DURATION = 2000; // 2秒
export const TOAST_DURATION_LONG = 3000; // 3秒

// 分页配置
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 1;

// 输入限制
export const MAX_CONTENT_LENGTH = 500; // 最大内容长度
export const MAX_FEEDBACK_LENGTH = 200; // 最大反馈长度（与 backend 保持一致）
export const MIN_FEEDBACK_LENGTH = 5; // 最小反馈长度

// 加载状态文本
export const LOADING_TEXT = {
  DEFAULT: '加载中...',
  SAVING: '保存中...',
  SUBMITTING: '提交中...',
  GENERATING: '生成中...',
  UPLOADING: '上传中...',
} as const;

// Toast 图标类型
export const TOAST_ICON = {
  SUCCESS: 'success',
  ERROR: 'error',
  NONE: 'none',
  LOADING: 'loading',
} as const;

// 情绪风格相关常量已移至 @/constants/tone-style.constants.ts
// 为保持向后兼容，这里重新导出（建议直接使用新文件）
export {
  TONE_STYLE_ICONS,
  TONE_STYLE_LABELS as TONE_STYLE_NAMES,
  TONE_STYLE_COLORS,
  getToneStyleIcon,
  getToneStyleLabel,
  getToneStyleColor,
} from './tone-style.constants';

