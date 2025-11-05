import { PrismaClient } from '@prisma/client';
import { config } from './index';

// 创建Prisma客户端单例
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (config.env !== 'production') globalThis.prisma = prisma;

// 优雅关闭数据库连接
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};

