/**
 * Toast 工具函数
 * 封装 uni.showToast，提供统一的提示体验
 */

import { TOAST_DURATION, TOAST_DURATION_LONG, TOAST_ICON } from '@/constants/ui.constants';

export interface ToastOptions {
  title: string;
  icon?: 'success' | 'error' | 'none' | 'loading';
  duration?: number;
  mask?: boolean;
}

/**
 * 显示成功提示
 */
export const showSuccess = (title: string, duration: number = TOAST_DURATION) => {
  uni.showToast({
    title,
    icon: TOAST_ICON.SUCCESS,
    duration,
  });
};

/**
 * 显示错误提示
 */
export const showError = (title: string, duration: number = TOAST_DURATION) => {
  uni.showToast({
    title,
    icon: TOAST_ICON.NONE,
    duration,
  });
};

/**
 * 显示普通提示
 */
export const showToast = (title: string, duration: number = TOAST_DURATION) => {
  uni.showToast({
    title,
    icon: TOAST_ICON.NONE,
    duration,
  });
};

/**
 * 显示长时间提示
 */
export const showLongToast = (title: string) => {
  uni.showToast({
    title,
    icon: TOAST_ICON.NONE,
    duration: TOAST_DURATION_LONG,
  });
};

/**
 * 显示加载提示
 */
export const showLoading = (title: string = '加载中...', mask: boolean = true) => {
  uni.showLoading({
    title,
    mask,
  });
};

/**
 * 隐藏加载提示
 */
export const hideLoading = () => {
  uni.hideLoading();
};

/**
 * 使用 Loading 包装异步操作
 */
export const withLoading = async <T>(
  loadingText: string,
  asyncFn: () => Promise<T>,
  options?: {
    successText?: string;
    errorText?: string;
    showSuccessToast?: boolean;
  }
): Promise<T> => {
  try {
    showLoading(loadingText);
    const result = await asyncFn();
    hideLoading();
    
    if (options?.showSuccessToast && options?.successText) {
      showSuccess(options.successText);
    }
    
    return result;
  } catch (error: any) {
    hideLoading();
    
    const errorMessage = options?.errorText || error.message || '操作失败';
    showError(errorMessage);
    
    throw error;
  }
};

export default {
  showSuccess,
  showError,
  showToast,
  showLongToast,
  showLoading,
  hideLoading,
  withLoading,
};

