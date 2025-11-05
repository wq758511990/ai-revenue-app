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

// 情绪风格图标映射
export const TONE_STYLE_ICONS: Record<string, string> = {
  ENTHUSIASTIC: '🔥',
  PROFESSIONAL: '💼',
  HUMOROUS: '😄',
  GENTLE: '🌸',
  CONCISE: '⚡',
};

// 情绪风格名称映射
export const TONE_STYLE_NAMES: Record<string, string> = {
  ENTHUSIASTIC: '热情洋溢',
  PROFESSIONAL: '专业严谨',
  HUMOROUS: '轻松幽默',
  GENTLE: '温柔亲和',
  CONCISE: '简洁直接',
};

// 情绪风格颜色
export const TONE_STYLE_COLORS: Record<string, string> = {
  ENTHUSIASTIC: 'background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);',
  PROFESSIONAL: 'background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);',
  HUMOROUS: 'background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);',
  GENTLE: 'background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);',
  CONCISE: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);',
};

