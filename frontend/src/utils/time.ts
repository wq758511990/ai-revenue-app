/**
 * 时间格式化工具函数
 */

import { TIME_THRESHOLDS, TIME_UNITS } from '@/constants/time.constants';

/**
 * 格式化相对时间（如：刚刚、5分钟前、3小时前）
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 刚刚
  if (diff < TIME_THRESHOLDS.JUST_NOW) {
    return '刚刚';
  }

  // X分钟前
  if (diff < TIME_THRESHOLDS.MINUTES_AGO) {
    const minutes = Math.floor(diff / TIME_UNITS.MINUTE);
    return `${minutes}分钟前`;
  }

  // X小时前
  if (diff < TIME_THRESHOLDS.HOURS_AGO) {
    const hours = Math.floor(diff / TIME_UNITS.HOUR);
    return `${hours}小时前`;
  }

  // X天前
  if (diff < TIME_THRESHOLDS.DAYS_AGO) {
    const days = Math.floor(diff / TIME_UNITS.DAY);
    return `${days}天前`;
  }

  // 超过7天，显示完整日期
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 格式化日期时间
 */
export const formatDateTime = (dateString: string, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  const date = new Date(dateString);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
};

/**
 * 格式化日期（年-月-日）
 */
export const formatDate = (dateString: string): string => {
  return formatDateTime(dateString, 'YYYY-MM-DD');
};

/**
 * 格式化时间（时:分）
 */
export const formatTime = (dateString: string): string => {
  return formatDateTime(dateString, 'HH:mm');
};

export default {
  formatRelativeTime,
  formatDateTime,
  formatDate,
  formatTime,
};

