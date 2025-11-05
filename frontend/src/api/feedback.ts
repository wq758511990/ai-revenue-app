/**
 * Feedback API
 * 用户反馈相关的API接口
 */

import { request } from '@/utils/request';

export type FeedbackType = 'NEW_TONE' | 'NEW_SCENARIO' | 'FEATURE_REQUEST' | 'BUG_REPORT';
export type FeedbackStatus = 'SUBMITTED' | 'IN_PROGRESS' | 'ADOPTED' | 'REPLIED' | 'CLOSED';

export interface Feedback {
  id: string;
  userId: string;
  feedbackType: FeedbackType;
  content: string;
  status: FeedbackStatus;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    nickname?: string;
    avatarUrl?: string;
  };
}

export interface FeedbackListResponse {
  feedbacks: Feedback[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FeedbackStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

/**
 * 提交反馈
 */
export const submitFeedback = (data: {
  feedbackType: FeedbackType;
  content: string;
}) => {
  return request<Feedback>({
    url: '/feedback',
    method: 'POST',
    data,
  });
};

/**
 * 获取用户的反馈列表
 */
export const getUserFeedbacks = (params?: {
  feedbackType?: FeedbackType;
  status?: FeedbackStatus;
  page?: number;
  limit?: number;
}) => {
  return request<FeedbackListResponse>({
    url: '/feedback',
    method: 'GET',
    data: params,
  });
};

/**
 * 获取反馈详情
 */
export const getFeedbackDetail = (feedbackId: string) => {
  return request<Feedback>({
    url: `/feedback/${feedbackId}`,
    method: 'GET',
  });
};

/**
 * 获取反馈统计
 */
export const getFeedbackStats = () => {
  return request<FeedbackStats>({
    url: '/feedback/stats',
    method: 'GET',
  });
};

/**
 * 反馈类型的中文名称映射
 */
export const feedbackTypeNames: Record<FeedbackType, string> = {
  NEW_TONE: '建议新增情绪风格',
  NEW_SCENARIO: '建议新增场景',
  FEATURE_REQUEST: '功能建议',
  BUG_REPORT: '问题反馈',
};

/**
 * 反馈状态的中文名称映射
 */
export const feedbackStatusNames: Record<FeedbackStatus, string> = {
  SUBMITTED: '已提交',
  IN_PROGRESS: '处理中',
  ADOPTED: '已采纳',
  REPLIED: '已回复',
  CLOSED: '已关闭',
};

/**
 * 反馈状态的颜色映射
 */
export const feedbackStatusColors: Record<FeedbackStatus, string> = {
  SUBMITTED: '#909399',
  IN_PROGRESS: '#409EFF',
  ADOPTED: '#67C23A',
  REPLIED: '#E6A23C',
  CLOSED: '#909399',
};

