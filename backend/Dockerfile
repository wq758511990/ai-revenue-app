# ============================================
# Stage 1: 构建阶段
# ============================================
FROM node:18-slim AS builder

WORKDIR /app

# 安装系统依赖（这一层会被缓存）
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 复制 package 文件（单独一层，便于缓存）
COPY package*.json ./

# 安装依赖（这一层也会被缓存）
RUN npm ci

# 复制 Prisma schema
COPY prisma ./prisma/

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY src ./src/
COPY tsconfig.json ./

# 编译 TypeScript
RUN npm run build

# ============================================
# Stage 2: 生产运行阶段（更小的镜像）
# ============================================
FROM node:18-slim

WORKDIR /app

# 只安装运行时必需的依赖
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 从构建阶段复制必要文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/

# 验证构建
RUN echo "=== 验证文件 ===" && \
    ls -la /app/dist/ && \
    test -f /app/dist/app.js && echo "✅ app.js 存在" || echo "❌ app.js 不存在"

# 暴露端口
EXPOSE 3000

# 启动脚本
CMD ["sh", "-c", "set -e && \
    echo '=== 环境变量检查 ===' && \
    echo \"NODE_ENV: $NODE_ENV\" && \
    echo \"PORT: $PORT\" && \
    echo \"DATABASE_URL: ${DATABASE_URL:0:30}...\" && \
    echo \"JWT_SECRET: ${JWT_SECRET:0:10}...\" && \
    echo '' && \
    echo '🔄 Running database migrations...' && \
    npx prisma migrate deploy && \
    echo '🌱 Seeding database...' && \
    npx prisma db seed && \
    echo '🚀 Starting application...' && \
    exec node dist/app.js"]

