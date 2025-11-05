import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * 使用AES-256-CBC加密
 */
export const encrypt = (text: string, secretKey: string): string => {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * 使用AES-256-CBC解密
 */
export const decrypt = (encryptedText: string, secretKey: string): string => {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * 生成哈希值
 */
export const hash = (text: string): Promise<string> => {
  return bcrypt.hash(text, 10);
};

/**
 * 验证哈希
 */
export const verifyHash = (text: string, hashedText: string): Promise<boolean> => {
  return bcrypt.compare(text, hashedText);
};

/**
 * 生成随机字符串
 */
export const generateRandomString = (length: number): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

/**
 * MD5哈希
 */
export const md5 = (text: string): string => {
  return crypto.createHash('md5').update(text).digest('hex');
};

/**
 * SHA256哈希
 */
export const sha256 = (text: string): string => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

