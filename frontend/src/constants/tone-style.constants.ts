/**
 * 情绪风格常量定义
 */

/**
 * 情绪风格中文名称映射
 */
export const TONE_STYLE_LABELS: Record<string, string> = {
  ENTHUSIASTIC: '热情洋溢',
  PROFESSIONAL: '专业严谨',
  HUMOROUS: '轻松幽默',
  GENTLE: '温柔亲和',
  CONCISE: '简洁直接',
};

/**
 * 获取情绪风格的中文名称
 * @param slug 情绪风格的 slug
 * @returns 中文名称
 */
export function getToneStyleLabel(slug: string): string {
  return TONE_STYLE_LABELS[slug] || slug;
}

/**
 * 情绪风格图标映射（用于 UI 显示）
 */
export const TONE_STYLE_ICONS: Record<string, string> = {
  ENTHUSIASTIC: '🎉',
  PROFESSIONAL: '💼',
  HUMOROUS: '😄',
  GENTLE: '🌸',
  CONCISE: '✨',
};

/**
 * 获取情绪风格的图标
 * @param slug 情绪风格的 slug
 * @returns 图标 emoji
 */
export function getToneStyleIcon(slug: string): string {
  return TONE_STYLE_ICONS[slug] || '📝';
}

/**
 * 情绪风格颜色映射（用于 UI 显示，返回 CSS 样式字符串）
 */
export const TONE_STYLE_COLORS: Record<string, string> = {
  ENTHUSIASTIC: 'background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);',
  PROFESSIONAL: 'background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);',
  HUMOROUS: 'background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);',
  GENTLE: 'background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);',
  CONCISE: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);',
};

/**
 * 获取情绪风格的颜色样式
 * @param slug 情绪风格的 slug
 * @returns 颜色样式 CSS 字符串
 */
export function getToneStyleColor(slug: string): string {
  return TONE_STYLE_COLORS[slug] || TONE_STYLE_COLORS.ENTHUSIASTIC;
}

