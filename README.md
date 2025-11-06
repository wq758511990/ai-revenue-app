# 灵眸ai文案小程序

一个基于AI的智能文案生成工具，支持12种场景、5种情绪风格，帮助用户快速生成专业的营销文案。

## 📋 项目概述

- **后端**: Node.js + TypeScript + Express + Prisma + MySQL + Redis
- **前端**: uni-app + Vue3 + TypeScript + Pinia
- **AI Provider**: DeepSeek (主) + SiliconFlow + Groq (备用)
- **数据库**: MySQL 8.0 + Redis 6+

## 🚀 快速开始（5分钟）

### 前置要求
- 安装 Docker 和 Docker Compose
- 获取微信小程序 AppID 和 AppSecret
- 获取 DeepSeek API Key

### 本地开发（Docker）

```bash
cd backend

# 1. 配置环境变量
cp .env.example .env
nano .env  # 填入微信和 AI 配置

# 2. 启动所有服务（推荐）
docker-compose up -d

# 3. 查看日志
docker-compose logs -f api
```

### 生产部署

```bash
cd backend

# 1. 配置生产环境变量
cp .env.production.example .env.production
nano .env.production  # 填入配置

# 2. 使用生产配置启动
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. 查看状态
docker-compose ps
docker-compose logs -f api

# 验证服务
curl http://localhost:3000/health
```

**完成！** 后端服务已运行在 http://localhost:3000

### 前端小程序

```bash
cd frontend

# 安装依赖
npm install

# 编译小程序
npm run build:mp-weixin

# 使用微信开发者工具打开 dist/build/mp-weixin 目录
```

**详细部署指南**：查看 [SIMPLE_DEPLOY.md](./SIMPLE_DEPLOY.md)

## 📦 项目结构

```
ai-revenue-app/
├── backend/                 # 后端服务
│   ├── prisma/             # 数据库Schema和迁移
│   │   ├── schema.prisma   # Prisma Schema定义
│   │   ├── seed.ts         # 种子数据
│   │   └── migrations/     # 数据库迁移文件
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   ├── utils/          # 工具函数
│   │   └── app.ts          # 应用入口
│   ├── docker-compose.yml  # Docker配置
│   └── package.json
│
├── frontend/               # 前端uni-app
│   ├── src/
│   │   ├── pages/         # 页面
│   │   ├── components/    # 组件
│   │   ├── stores/        # Pinia状态管理
│   │   ├── api/           # API调用
│   │   ├── utils/         # 工具函数
│   │   └── main.ts        # 应用入口
│   └── package.json
│
└── specs/                  # 项目规范文档
    └── 001-ai-copywriting-mini-app/
        ├── spec.md         # 需求规格
        ├── plan.md         # 技术规划
        ├── data-model.md   # 数据模型
        ├── tasks.md        # 任务清单
        └── quickstart.md   # 快速开始指南
```

## ✨ 核心功能

### 已实现功能 (58%)

✅ **文案生成系统**
- 12个专业场景（小红书、抖音、公众号、招聘JD等）
- 5种情绪风格（热情、专业、幽默、温柔、简洁）
- 3个AI Provider自动降级
- 内容安全审核（本地+微信API）

✅ **配额管理系统**
- Redis + MySQL双存储
- 每日配额自动重置
- 智能扣减和失败回滚

✅ **前端完整体验**
- 场景搜索和分类
- 动态表单生成
- 情绪风格选择器
- 完整组件库

✅ **基础设施**
- 微信登录 + JWT认证
- 频率限制保护
- 统一错误处理
- 日志系统

### 待实现功能 (42%)

⏳ **支付系统** (Phase 6剩余)
- 订单管理
- 微信支付集成
- 会员激活

⏳ **增强功能** (Phase 7-11)
- 历史记录
- 文案编辑
- 用户反馈
- 按次付费

## 🔧 环境变量配置

后端 `.env` 配置示例：

```bash
# 数据库配置
DATABASE_URL="mysql://root:password@localhost:3306/ai_copywriting"
REDIS_URL="redis://localhost:6379"

# 微信小程序配置
WECHAT_APP_ID="your_wechat_appid"
WECHAT_APP_SECRET="your_wechat_app_secret"

# JWT配置
JWT_SECRET="your_jwt_secret_min_32_characters"

# AI Provider配置
DEEPSEEK_API_KEY="your_deepseek_api_key"
SILICONFLOW_API_KEY="your_siliconflow_api_key"
GROQ_API_KEY="your_groq_api_key"
```

## 📝 API文档

API文档位于 `specs/001-ai-copywriting-mini-app/contracts/api-spec.yaml`

主要API端点：

- `POST /v1/auth/login` - 微信登录
- `GET /v1/scenarios` - 获取场景列表
- `GET /v1/tone-styles` - 获取情绪风格列表
- `POST /v1/content/generate` - 生成文案
- `GET /v1/user/profile` - 获取用户信息
- `GET /v1/user/quota` - 获取配额信息

## 🎯 开发进度

**当前进度**: 102/176 任务 (58%)

- ✅ Phase 1-2: 基础设施 (100%)
- ✅ Phase 3-5: 核心功能 (98%)
- 🚧 Phase 6: 会员体系 (59%)
- ⏳ Phase 7-11: 增强功能 (0%)

详细任务清单见 `specs/001-ai-copywriting-mini-app/tasks.md`

## 🔗 相关文档

- [需求规格说明](specs/001-ai-copywriting-mini-app/spec.md)
- [技术规划](specs/001-ai-copywriting-mini-app/plan.md)
- [数据模型](specs/001-ai-copywriting-mini-app/data-model.md)
- [任务清单](specs/001-ai-copywriting-mini-app/tasks.md)
- [快速开始指南](specs/001-ai-copywriting-mini-app/quickstart.md)

## 🛠️ 技术亮点

1. **多Provider架构**: 自动降级保证服务可用性
2. **配额双存储**: Redis快速访问 + MySQL持久化
3. **动态配置**: 场景和情绪风格可数据库配置
4. **失败回滚**: 生成失败自动退还配额
5. **内容安全**: 本地DFA算法 + 微信API双层防护

## 📊 数据库Schema

项目使用Prisma ORM，主要数据模型：

- **User**: 用户账户和会员信息
- **ContentScenario**: 文案场景配置（12个）
- **ToneStyle**: 情绪风格配置（5种）
- **ContentRecord**: 文案生成记录
- **Order**: 订单记录
- **Feedback**: 用户反馈

完整Schema见 `backend/prisma/schema.prisma`

## 🤝 贡献指南

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 License

MIT

## 👥 团队

由AI辅助开发完成

---

**最后更新**: 2025-11-05  
**项目状态**: 🚧 MVP开发中 (58%完成)

