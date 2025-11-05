/**
 * HTTP 状态码和响应码常量
 */

// HTTP 状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// 业务响应码
export const RESPONSE_CODE = {
  SUCCESS: 0,     // 成功
  ERROR: -1,      // 失败
} as const;

// 响应消息
export const RESPONSE_MESSAGE = {
  SUCCESS: '操作成功',
  CREATED: '创建成功',
  BAD_REQUEST: '请求参数错误',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '无权访问',
  NOT_FOUND: '资源不存在',
  INTERNAL_ERROR: '服务器内部错误',
} as const;

