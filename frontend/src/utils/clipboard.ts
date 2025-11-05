/**
 * 剪贴板工具
 */

/**
 * 复制文本到剪贴板
 */
export const copyToClipboard = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    uni.setClipboardData({
      data: text,
      success: () => {
        uni.showToast({
          title: '复制成功',
          icon: 'success',
          duration: 1500,
        });
        resolve();
      },
      fail: (error) => {
        uni.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 1500,
        });
        reject(error);
      },
    });
  });
};

/**
 * 从剪贴板获取文本
 */
export const getClipboardData = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    uni.getClipboardData({
      success: (res) => {
        resolve(res.data);
      },
      fail: (error) => {
        reject(error);
      },
    });
  });
};

export default {
  copyToClipboard,
  getClipboardData,
};

