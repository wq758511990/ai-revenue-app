import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { config } from './config';
import prisma from './config/database';
import redis from './config/redis';
import logger from './utils/logger';

// 创建Express应用
const app: Application = express();

// 中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域
// 增加请求体大小限制以支持图片上传（base64）
// 9张图片 × 2MB × 1.33(base64膨胀) ≈ 24MB，设置为30MB留有余量
app.use(express.json({ limit: '30mb' })); // JSON解析
app.use(express.urlencoded({ extended: true, limit: '30mb' })); // URL编码解析

// 请求日志
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// 健康检查
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.env,
  });
});

// 导入路由
import authRoutes from './routes/auth.routes';
import contentRoutes from './routes/content.routes';
import feedbackRoutes from './routes/feedback.routes';
import paymentRoutes from './routes/payment.routes';
import scenarioRoutes from './routes/scenario.routes';
import toneStyleRoutes from './routes/tone-style.routes';
import userRoutes from './routes/user.routes';

// API版本路由
app.use(`/${config.apiVersion}/auth`, authRoutes);
app.use(`/${config.apiVersion}/content`, contentRoutes);
app.use(`/${config.apiVersion}/scenarios`, scenarioRoutes);
app.use(`/${config.apiVersion}/tone-styles`, toneStyleRoutes);
app.use(`/${config.apiVersion}/user`, userRoutes);
app.use(`/${config.apiVersion}/feedback`, feedbackRoutes);
app.use(`/${config.apiVersion}`, paymentRoutes);

// 404处理
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'Not Found',
  });
});

// 全局错误处理
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('未处理的错误:', err);
  res.status(500).json({
    code: 500,
    message: config.env === 'development' ? err.message : 'Internal Server Error',
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await prisma.$connect();
    logger.info('数据库连接成功');

    // 测试Redis连接
    await redis.ping();
    logger.info('Redis连接成功');

    // 启动HTTP服务器 - 监听所有网络接口（允许局域网访问）
    app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 服务器启动成功`);
      logger.info(`📍 运行环境: ${config.env}`);
      logger.info(`🌐 监听端口: ${config.port}`);
      logger.info(`📊 本地访问: http://localhost:${config.port}/${config.apiVersion}`);
      logger.info(`📱 局域网访问: http://10.172.110.154:${config.port}/${config.apiVersion}`);
      logger.info(`💡 真机调试时使用局域网地址`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，开始优雅关闭...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号，开始优雅关闭...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

// 启动服务器
startServer();

export default app;

