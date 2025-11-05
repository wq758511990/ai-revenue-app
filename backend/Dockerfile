# 后端 Dockerfile
# 使用 Debian-slim 基础镜像（Prisma 需要 OpenSSL 支持）
FROM node:18-slim

WORKDIR /app

# 安装 OpenSSL 和其他必要依赖
RUN apt-get update -y && \
    apt-get install -y openssl ca-certificates curl wget procps && \
    rm -rf /var/lib/apt/lists/*

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖（包括 devDependencies，因为需要 TypeScript 和 ts-node）
RUN npm install

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 编译 TypeScript
RUN npm run build

# 验证构建输出
RUN echo "=== 检查编译结果 ===" && \
    ls -la /app/ && \
    echo "=== dist 目录内容 ===" && \
    ls -la /app/dist/ && \
    echo "=== 查找 app.js ===" && \
    find /app/dist -name "app.js" -type f

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/app.js"]

