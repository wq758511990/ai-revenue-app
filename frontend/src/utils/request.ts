/**
 * 统一请求封装
 */

import { REQUEST_TIMEOUT } from '@/constants/ui.constants';

// 开发环境API配置
// 真机调试时，将 localhost 改为你电脑的局域网IP（如：http://10.172.110.154:3000/v1）
// 开发者工具调试时，使用 localhost 即可
const DEV_API_URL = 'http://localhost:3000/v1'; // 开发者工具用
// const DEV_API_URL = 'http://10.172.110.154:3000/v1'; // 真机调试用（取消注释并修改为你的IP）

const BASE_URL = process.env.NODE_ENV === 'development' 
  ? DEV_API_URL
  : 'https://your-production-api.com/v1';

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

