import { post, get, put } from '@/utils/request';

export interface GenerateRequest {
  scenarioSlug: string;
  toneStyleSlug: string;
  userInput: Record<string, any>;
}

export interface GenerateResponse {
  id: string;
  content: string;
  provider: string;
  generationTime: number;
}

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
  getHistory(page = 1, pageSize = 20): Promise<any> {
    return get('/content/history', { page, pageSize });
  },

  /**
   * 获取单条记录
   */
  getById(id: string): Promise<any> {
    return get(`/content/${id}`);
  },

  /**
   * 编辑文案
   */
  editContent(id: string, editedContent: string): Promise<any> {
    return put(`/content/${id}/edit`, { editedContent });
  },

  /**
   * 获取"再次使用"数据
   */
  getReuseData(id: string): Promise<any> {
    return get(`/content/${id}/reuse`);
  },

  /**
   * 获取用户历史统计
   */
  getUserStats(): Promise<any> {
    return get('/content/stats');
  },
};

