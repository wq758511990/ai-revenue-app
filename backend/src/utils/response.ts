/**
 * 统一响应处理工具
 * 提供标准化的API响应格式
 */

import { Response } from 'express';

export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data?: T;
}

/**
 * 响应工具类
 */
export class ResponseUtil {
  /**
   * 成功响应
   */
  static success<T = any>(res: Response, data?: T, message?: string): void {
    const response: ApiResponse<T> = {
      code: 0,
      data,
    };
    
    if (message) {
      response.message = message;
    }
    
    res.json(response);
  }

  /**
   * 创建成功响应（201状态码）
   */
  static created<T = any>(res: Response, data?: T, message?: string): void {
    const response: ApiResponse<T> = {
      code: 0,
      data,
      message: message || '创建成功',
    };
    
    res.status(201).json(response);
  }

  /**
   * 错误响应
   */
  static error(res: Response, message: string, code: number = -1, statusCode: number = 500): void {
    const response: ApiResponse = {
      code,
      message,
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * 参数错误响应（400）
   */
  static badRequest(res: Response, message: string = '参数错误'): void {
    ResponseUtil.error(res, message, -1, 400);
  }

  /**
   * 未授权响应（401）
   */
  static unauthorized(res: Response, message: string = '未授权访问'): void {
    ResponseUtil.error(res, message, -1, 401);
  }

  /**
   * 禁止访问响应（403）
   */
  static forbidden(res: Response, message: string = '禁止访问'): void {
    ResponseUtil.error(res, message, -1, 403);
  }

  /**
   * 未找到响应（404）
   */
  static notFound(res: Response, message: string = '资源不存在'): void {
    ResponseUtil.error(res, message, -1, 404);
  }

  /**
   * 服务器错误响应（500）
   */
  static serverError(res: Response, message: string = '服务器错误'): void {
    ResponseUtil.error(res, message, -1, 500);
  }

  /**
   * 分页数据响应
   */
  static paginated<T = any>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string
  ): void {
    const response: ApiResponse = {
      code: 0,
      data: {
        list: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
    
    if (message) {
      response.message = message;
    }
    
    res.json(response);
  }
}

// 导出简化的函数
export const success = ResponseUtil.success;
export const created = ResponseUtil.created;
export const error = ResponseUtil.error;
export const badRequest = ResponseUtil.badRequest;
export const unauthorized = ResponseUtil.unauthorized;
export const forbidden = ResponseUtil.forbidden;
export const notFound = ResponseUtil.notFound;
export const serverError = ResponseUtil.serverError;
export const paginated = ResponseUtil.paginated;

export default ResponseUtil;

