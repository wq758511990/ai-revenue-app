/**
 * 统一请求封装
 */

import { REQUEST_TIMEOUT } from '@/constants/ui.constants';

// API 基础地址 - 通过环境变量配置
// 开发环境: 在 .env.development 中配置
// 生产环境: 在 .env.production 中配置
const BASE_URL = import.meta.env.VITE_API_URL;

export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, unknown> | unknown;
  header?: Record<string, string>;
  needAuth?: boolean;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/**
 * 统一请求方法
 */
export const request = <T = unknown>(options: RequestOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    // 获取token
    const token = uni.getStorageSync('token');

    // 设置请求头
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.header || {}),
    };

    // 如果需要认证，添加token
    if (options.needAuth !== false && token) {
      header.Authorization = `Bearer ${token}`;
    }

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: REQUEST_TIMEOUT,
      success: (res: UniApp.RequestSuccessCallbackResult) => {
        const response = res.data as ApiResponse<T>;

        if (response.code === 0) {
          resolve(response.data);
        } else {
          // 只处理业务错误，不显示 UI（由调用方决定）
          reject(new Error(response.message || '请求失败'));
        }
      },
      fail: (error: UniApp.GeneralCallbackResult) => {
        // 只处理网络错误，不显示 UI（由调用方决定）
        console.error('请求失败:', error);
        reject(new Error('网络请求失败'));
      },
    });
  });
};

/**
 * GET请求
 */
export const get = <T = unknown>(url: string, data?: Record<string, unknown> | unknown, needAuth = true): Promise<T> => {
  return request<T>({ url, method: 'GET', data, needAuth });
};

/**
 * POST请求
 */
export const post = <T = unknown>(url: string, data?: Record<string, unknown> | unknown, needAuth = true): Promise<T> => {
  return request<T>({ url, method: 'POST', data, needAuth });
};

/**
 * PUT请求
 */
export const put = <T = unknown>(url: string, data?: Record<string, unknown> | unknown, needAuth = true): Promise<T> => {
  return request<T>({ url, method: 'PUT', data, needAuth });
};

/**
 * DELETE请求
 */
export const del = <T = unknown>(url: string, data?: Record<string, unknown> | unknown, needAuth = true): Promise<T> => {
  return request<T>({ url, method: 'DELETE', data, needAuth });
};

export default { request, get, post, put, del };
