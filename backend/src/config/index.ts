import dotenv from 'dotenv';

// 加载环境变量（Docker 环境会通过 env_file 注入，本地开发需要 .env 文件）
// 如果环境变量已经存在（Docker），dotenv 不会覆盖它们
dotenv.config();

export const config = {
  // 服务配置
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // 微信配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    mchId: process.env.WECHAT_MCH_ID || '',
    apiKey: process.env.WECHAT_API_KEY || '',
    certPath: process.env.WECHAT_CERT_PATH || '',
    keyPath: process.env.WECHAT_KEY_PATH || '',
    contentSecurityUrl: process.env.WECHAT_CONTENT_SECURITY_URL || '',
    paymentNotifyUrl: process.env.WECHAT_PAYMENT_NOTIFY_URL || 'https://your-domain.com/api/payment/notify',
  },

  // AI Provider配置
  ai: {
    primaryProvider: process.env.AI_PRIMARY_PROVIDER || 'deepseek',
    fallbackProviders: (process.env.AI_FALLBACK_PROVIDERS || '').split(',').filter(Boolean),
    timeout: parseInt(process.env.AI_TIMEOUT || '10000', 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '2', 10),
    deepseek: {
      apiKey: (process.env.DEEPSEEK_API_KEY || '').trim(),
      apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    },
    siliconflow: {
      apiKey: (process.env.SILICONFLOW_API_KEY || '').trim(),
      apiUrl: process.env.SILICONFLOW_API_URL || 'https://api.siliconflow.cn/v1',
      model: process.env.SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-V2.5',
      visionModel: process.env.SILICONFLOW_VISION_MODEL || 'Qwen/Qwen2.5-VL-32B-Instruct',
    },
    groq: {
      apiKey: (process.env.GROQ_API_KEY || '').trim(),
      apiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1',
      model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
    },
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },

  // 配额配置
  quota: {
    free: parseInt(process.env.QUOTA_FREE_DAILY || '20', 10),
    monthly: parseInt(process.env.QUOTA_MONTHLY_DAILY || '50', 10),
    yearly: parseInt(process.env.QUOTA_YEARLY_DAILY || '99999', 10),
  },
};

