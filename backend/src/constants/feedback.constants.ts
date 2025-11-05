/**
 * 反馈系统常量配置
 */

/**
 * 反馈内容限制
 */
export const FEEDBACK_CONTENT_LIMITS = {
  MIN_LENGTH: 5,      // 最小字符数
  MAX_LENGTH: 200,    // 最大字符数
} as const;

/**
 * 反馈防重复提交配置
 */
export const FEEDBACK_DUPLICATE_CHECK = {
  TIME_WINDOW_MINUTES: 10,  // 重复提交检查时间窗口（分钟）
} as const;

/**
 * 反馈分页默认配置
 */
export const FEEDBACK_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * 反馈提示消息
 */
export const FEEDBACK_MESSAGES = {
  DUPLICATE_SUBMIT: '您刚刚已经提交过相同的反馈，请勿重复提交',
  SUBMIT_SUCCESS: '反馈提交成功',
  CONTENT_TOO_SHORT: `反馈内容至少需要${FEEDBACK_CONTENT_LIMITS.MIN_LENGTH}个字符`,
  CONTENT_TOO_LONG: `反馈内容不能超过${FEEDBACK_CONTENT_LIMITS.MAX_LENGTH}个字符`,
  INVALID_TYPE: '无效的反馈类型',
  REQUIRED_FIELDS: '反馈类型和内容不能为空',
  HAS_SENSITIVE_WORDS: '反馈内容包含敏感词，请修改后重新提交',
} as const;

