/**
 * 统一导航工具
 * 遵循 DRY 原则，所有页面跳转统一管理
 */

/**
 * 页面路径常量
 */
export const ROUTES = {
  // 主页面
  INDEX: '/pages/index/index',
  GENERATE: '/pages/generate/generate',
  RESULT: '/pages/result/result',
  PROFILE: '/pages/profile/profile',
  
  // 子页面
  MEMBERSHIP: '/pages-sub/membership/membership',
  HISTORY: '/pages-sub/profile/history',
  FEEDBACK: '/pages-sub/profile/feedback',
  FEEDBACK_HISTORY: '/pages-sub/profile/feedback-history',
} as const;

/**
 * 导航到指定页面
 */
export function navigateTo(url: string, params?: Record<string, string | number | boolean>) {
  let fullUrl = url;
  if (params) {
    const query = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    fullUrl = `${url}?${query}`;
  }
  uni.navigateTo({ url: fullUrl });
}

/**
 * 跳转到 Tab 页面
 */
export function switchTab(url: string) {
  uni.switchTab({ url });
}

/**
 * 返回上一页
 */
export function navigateBack(delta = 1) {
  uni.navigateBack({ delta });
}

/**
 * 重定向到指定页面
 */
export function redirectTo(url: string, params?: Record<string, string | number | boolean>) {
  let fullUrl = url;
  if (params) {
    const query = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    fullUrl = `${url}?${query}`;
  }
  uni.redirectTo({ url: fullUrl });
}

/**
 * 关闭所有页面，打开到应用内的某个页面
 */
export function reLaunch(url: string) {
  uni.reLaunch({ url });
}

