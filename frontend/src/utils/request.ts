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
  data?: any;
  header?: any;
  needAuth?: boolean;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 统一请求方法
 */
export const request = <T = any>(options: RequestOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    // 获取token
    const token = uni.getStorageSync('token');

    // 设置请求头
    const header: any = {
      'Content-Type': 'application/json',
      ...options.header,
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
      success: (res: any) => {
        const response = res.data as ApiResponse<T>;

        if (response.code === 0) {
          resolve(response.data);
        } else {
          // 只处理业务错误，不显示 UI（由调用方决定）
          reject(new Error(response.message || '请求失败'));
        }
      },
      fail: (error: any) => {
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
export const get = <T = any>(url: string, data?: any, needAuth = true): Promise<T> => {
  return request<T>({ url, method: 'GET', data, needAuth });
};

/**
 * POST请求
 */
export const post = <T = any>(url: string, data?: any, needAuth = true): Promise<T> => {
  return request<T>({ url, method: 'POST', data, needAuth });
};

/**
 * PUT请求
 */
export const put = <T = any>(url: string, data?: any, needAuth = true): Promise<T> => {
  return request<T>({ url, method: 'PUT', data, needAuth });
};

/**
 * DELETE请求
 */
export const del = <T = any>(url: string, data?: any, needAuth = true): Promise<T> => {
  return request<T>({ url, method: 'DELETE', data, needAuth });
};

export default { request, get, post, put, del };
