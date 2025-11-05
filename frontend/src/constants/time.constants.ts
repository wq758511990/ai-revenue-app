/**
 * 时间相关常量
 */

// 时间转换常量（毫秒）
export const TIME_UNITS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// 时间阈值
export const TIME_THRESHOLDS = {
  JUST_NOW: TIME_UNITS.MINUTE, // 1分钟内显示"刚刚"
  MINUTES_AGO: TIME_UNITS.HOUR, // 1小时内显示"X分钟前"
  HOURS_AGO: TIME_UNITS.DAY, // 1天内显示"X小时前"
  DAYS_AGO: TIME_UNITS.WEEK, // 1周内显示"X天前"
} as const;

// 数值常量（用于时间计算）
export const TIME_VALUES = {
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
} as const;

