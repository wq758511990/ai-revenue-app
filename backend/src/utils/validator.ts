/**
 * 参数验证工具类
 */

/**
 * 验证必填字段
 */
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${fieldName} 是必填项`);
  }
};

/**
 * 验证字符串长度
 */
export const validateLength = (
  value: string,
  min: number,
  max: number,
  fieldName: string
): void => {
  if (value.length < min || value.length > max) {
    throw new Error(`${fieldName} 长度必须在 ${min} 到 ${max} 之间`);
  }
};

/**
 * 验证数字范围
 */
export const validateRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string
): void => {
  if (value < min || value > max) {
    throw new Error(`${fieldName} 必须在 ${min} 到 ${max} 之间`);
  }
};

/**
 * 验证枚举值
 */
export const validateEnum = <T>(value: T, allowedValues: T[], fieldName: string): void => {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} 必须是以下值之一: ${allowedValues.join(', ')}`);
  }
};

/**
 * 验证手机号（简单验证）
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 验证邮箱
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证JSON字符串
 */
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * 清理HTML标签
 */
export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * 验证对象结构
 */
export const validateSchema = (obj: any, schema: Record<string, any>): void => {
  for (const key in schema) {
    const rule = schema[key];
    const value = obj[key];

    if (rule.required) {
      validateRequired(value, key);
    }

    if (value !== undefined && value !== null) {
      if (rule.type && typeof value !== rule.type) {
        throw new Error(`${key} 类型必须是 ${rule.type}`);
      }

      if (rule.minLength !== undefined && typeof value === 'string') {
        validateLength(value, rule.minLength, rule.maxLength || Infinity, key);
      }

      if (rule.min !== undefined && typeof value === 'number') {
        validateRange(value, rule.min, rule.max || Infinity, key);
      }

      if (rule.enum) {
        validateEnum(value, rule.enum, key);
      }
    }
  }
};

