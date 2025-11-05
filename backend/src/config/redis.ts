import Redis from 'ioredis';
import { config } from './index';
import logger from '../utils/logger';

// 创建Redis客户端
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  db: config.redis.db,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info('Redis连接成功');
});

redis.on('error', (err: Error) => {
  logger.error('Redis连接错误:', err);
});

redis.on('close', () => {
  logger.warn('Redis连接关闭');
});

export default redis;

// 优雅关闭Redis连接
export const disconnectRedis = async () => {
  await redis.quit();
};

