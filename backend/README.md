# AI智能文案助手 - 后端API

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动数据库

```bash
docker-compose up -d
```

### 3. 配置环境变量

复制 `.env.example` 并重命名为 `.env`，填写必要的配置。

### 4. 初始化数据库

```bash
# 生成Prisma Client
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# 填充种子数据
pnpm prisma:seed
```

### 5. 启动开发服务器

```bash
pnpm dev
```

服务将运行在 `http://localhost:3000`

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── services/        # 业务逻辑
│   ├── middleware/      # 中间件
│   ├── utils/           # 工具函数
│   └── app.ts           # 应用入口
├── prisma/
│   ├── schema.prisma    # 数据模型
│   ├── migrations/      # 数据库迁移
│   └── seed.ts          # 种子数据
└── logs/                # 日志文件
```

## 可用脚本

- `pnpm dev` - 启动开发服务器（带热重载）
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
- `pnpm lint` - 运行ESLint检查
- `pnpm format` - 格式化代码
- `pnpm prisma:generate` - 生成Prisma Client
- `pnpm prisma:migrate` - 运行数据库迁移
- `pnpm prisma:seed` - 填充种子数据
- `pnpm prisma:studio` - 打开Prisma Studio

## API文档

详见 `/specs/001-ai-copywriting-mini-app/contracts/api-spec.yaml`

