/**
 * 全局类型定义
 * 统一管理所有共享类型，遵循 DRY 原则
 */

/**
 * ==================
 * 用户相关类型
 * ==================
 */
export interface QuotaInfo {
  userId: string;
  dailyQuota: number;
  usedQuota: number;
  remainingQuota: number;
  purchasedQuota: number;
  membershipType: 'FREE' | 'MONTHLY' | 'YEARLY';
  membershipExpireAt: string | null;
  resetAt: string;
}

export interface UserProfile {
  id: string;
  nickname?: string;
  avatarUrl?: string;
  membershipType: string;
  membershipExpireAt?: string;
}

/**
 * ==================
 * 内容生成相关类型
 * ==================
 */
export interface GenerateRequest {
  scenarioSlug: string;
  toneStyle: string;
  userInput: Record<string, string>;
}

export interface GenerateResponse {
  id: string;
  content: string;
  provider?: string;
  generationTime?: number;
}

export interface ContentRecord {
  id: string;
  scenarioId: string;
  toneStyle: string;
  userInput: Record<string, unknown>;
  generatedContent: string;
  isEdited: boolean;
  editedContent?: string;
  createdAt: string;
  scenario?: {
    name: string;
    slug: string;
    platform: string;
  };
}

export interface HistoryResponse {
  records: ContentRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HistoryStats {
  totalCount: number;
  recentCount: number;
  scenarioStats: Array<{ scenarioId: string; count: number }>;
  toneStyleStats: Array<{ toneStyle: string; count: number }>;
}

/**
 * ==================
 * 反馈相关类型
 * ==================
 */
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
 * ==================
 * 场景和表单相关类型
 * ==================
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  options?: string[];
}

export interface ToneStyle {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
}

export interface Scenario {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  platform: string;
  inputSchema: {
    fields: FormField[];
  };
  defaultToneStyle: string;
}

/**
 * ==================
 * 分页相关类型
 * ==================
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

