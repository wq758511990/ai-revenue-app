import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import logger from '../utils/logger';

// 扩展Request接口，添加user属性
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * 认证中间件 - 验证JWT Token
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌',
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 验证token
    const decoded = verifyToken(token);

    // 将用户信息附加到请求对象
    req.user = decoded;

    next();
  } catch (error) {
    logger.warn('Token验证失败:', error);
    return res.status(401).json({
      code: 401,
      message: 'Token无效或已过期',
    });
  }
};

/**
 * 可选认证中间件 - token可选
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // 可选认证失败不阻塞请求
    next();
  }
};

