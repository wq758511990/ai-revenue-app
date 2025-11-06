import { post, get, put } from '@/utils/request';
import type { GenerateRequest, GenerateResponse, HistoryResponse, HistoryStats, ContentRecord } from '@/types';

export const apiContent = {
  /**
   * 生成文案
   */
  generate(data: GenerateRequest): Promise<GenerateResponse> {
    return post<GenerateResponse>('/content/generate', data);
  },

  /**
   * 获取历史记录
   */
  getHistory(page = 1, pageSize = 20): Promise<HistoryResponse> {
    return get<HistoryResponse>('/content/history', { page, pageSize });
  },

  /**
   * 获取单条记录
   */
  getById(id: string): Promise<ContentRecord> {
    return get<ContentRecord>(`/content/${id}`);
  },

  /**
   * 编辑文案
   */
  editContent(id: string, editedContent: string): Promise<ContentRecord> {
    return put<ContentRecord>(`/content/${id}/edit`, { editedContent });
  },

  /**
   * 获取"再次使用"数据
   */
  getReuseData(id: string): Promise<{ scenarioSlug: string; toneStyle: string; userInput: Record<string, string> }> {
    return get(`/content/${id}/reuse`);
  },

  /**
   * 获取用户历史统计
   */
  getUserStats(): Promise<HistoryStats> {
    return get<HistoryStats>('/content/stats');
  },
};

