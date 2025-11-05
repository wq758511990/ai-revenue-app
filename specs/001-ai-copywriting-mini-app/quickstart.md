# Quick Start Guide: AI智能文案助手小程序

**Feature**: 001-ai-copywriting-mini-app  
**Date**: 2025-11-05  
**Target Audience**: 开发人员

## 项目概述

本指南帮助开发人员快速搭建AI智能文案助手小程序的开发环境并运行项目。

### 技术栈速览

- **前端**: uni-app 3.x（Vue 3 + TypeScript + Pinia）
- **后端**: Node.js 18+ / TypeScript 5.0+ / Express
- **数据库**: MySQL 8.0 + Redis 6.0
- **ORM**: Prisma
- **AI**: DeepSeek API（优化人性化提示词）
- **支付**: 微信小程序支付

---

## 前置要求

### 必需工具

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0（推荐）或 npm
- **Docker**: >= 20.10（用于本地数据库）
- **VS Code/Cursor**: 推荐安装uni-app插件
- **微信开发者工具**: 最新稳定版（用于微信小程序调试）

### 必需账号

- **微信小程序账号**: 已认证（支持支付功能）
- **DeepSeek账号**: 注册并获取API Key
- **云服务器**: 用于部署（开发阶段可选）

---

## 快速启动（5分钟）

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-revenue-app
```

### 2. 安装依赖

```bash
# 后端依赖
cd backend
pnpm install

# uni-app前端依赖
cd ../uniapp
pnpm install
```

### 3. 启动本地数据库

使用Docker Compose一键启动MySQL和Redis：

```bash
cd backend
docker-compose up -d
```

验证服务运行：
```bash
docker ps
# 应该看到mysql和redis容器运行中
```

### 4. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="mysql://root:password@localhost:3306/ai_copywriting"

# Redis配置
REDIS_URL="redis://localhost:6379"

# 微信小程序配置
WECHAT_APP_ID="your_app_id"
WECHAT_APP_SECRET="your_app_secret"
WECHAT_MCH_ID="your_mch_id"           # 商户号
WECHAT_API_KEY="your_api_key"         # 支付密钥

# DeepSeek AI配置
DEEPSEEK_API_KEY="your_deepseek_key"
DEEPSEEK_API_URL="https://api.deepseek.com/v1"

# JWT配置
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# 服务配置
PORT=3000
NODE_ENV=development
```

### 5. 初始化数据库

运行Prisma迁移和种子数据：

```bash
cd backend

# 生成Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 填充种子数据（12个场景配置）
npx prisma db seed
```

验证数据库：
```bash
npx prisma studio
# 打开浏览器查看数据
```

### 6. 启动后端服务

```bash
cd backend
pnpm dev
```

看到以下输出表示启动成功：
```
🚀 Server ready at: http://localhost:3000
📊 Prisma Studio: http://localhost:5555
```

测试API：
```bash
curl http://localhost:3000/health
# 应返回: {"status":"ok","timestamp":"..."}
```

### 7. 配置uni-app项目

1. 在Cursor/VS Code中打开 `uniapp` 目录

2. 修改 `uniapp/.env.development`:
```env
VUE_APP_API_BASE_URL=http://localhost:3000/v1
VUE_APP_WECHAT_APP_ID=your_app_id  # 与后端.env一致
```

3. 修改 `uniapp/manifest.json`，配置微信小程序appid：
```json
{
  "mp-weixin": {
    "appid": "your_app_id",
    "setting": {
      "urlCheck": false  // 开发阶段不校验域名
    }
  }
}
```

4. 启动编译：
```bash
cd uniapp
pnpm dev:mp-weixin  # 编译为微信小程序，watch模式
```

5. 打开微信开发者工具：
   - 点击「导入项目」
   - 选择 `uniapp/dist/dev/mp-weixin` 目录
   - 勾选「不校验合法域名」（开发阶段）
   - 编译成功后即可在模拟器中预览

---

## 开发工作流

### 后端开发

#### 启动开发服务器
```bash
cd backend
pnpm dev  # 带热重载
```

#### 运行测试
```bash
pnpm test          # 运行所有测试
pnpm test:watch    # 监听模式
pnpm test:coverage # 生成覆盖率报告
```

#### 数据库操作
```bash
# 创建新迁移
npx prisma migrate dev --name add_new_field

# 重置数据库（谨慎使用）
npx prisma migrate reset

# 查看数据库
npx prisma studio
```

#### 添加新API端点

1. 定义路由：`src/api/routes/your-feature.routes.ts`
```typescript
import { Router } from 'express';
import { YourController } from '../controllers/your.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const controller = new YourController();

router.get('/your-endpoint', authMiddleware, controller.getYourData);

export default router;
```

2. 实现控制器：`src/api/controllers/your.controller.ts`
3. 实现服务层：`src/services/your.service.ts`
4. 更新 `src/app.ts` 注册路由

### uni-app开发

#### 开发模式

在终端启动watch模式：
```bash
cd uniapp
pnpm dev:mp-weixin  # 启动watch模式
# 修改代码后自动重新编译，改动实时同步到微信开发者工具
```

**开发建议**：
- 保持终端运行watch模式
- 在Cursor/VS Code中编辑代码
- 在微信开发者工具中实时预览效果
- 使用微信开发者工具的热重载功能

#### 添加新页面

1. 在 `pages.json` 中注册页面：
```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": { "navigationBarTitleText": "首页" }
    },
    {
      "path": "pages/your-page/your-page",
      "style": { "navigationBarTitleText": "你的页面" }
    }
  ]
}
```

2. 创建页面文件：
```
pages/your-page/
├── your-page.vue    # 单文件组件（模板+逻辑+样式）
```

3. 页面模板示例：
```vue
<template>
  <view class="your-page">
    <text>{{ title }}</text>
    <button @click="handleClick">点击</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { apiYourModule } from '@/api';

const title = ref('你的页面');

async function handleClick() {
  try {
    const result = await apiYourModule.getData();
    console.log(result);
  } catch (error) {
    uni.showToast({
      title: error.message,
      icon: 'none'
    });
  }
}
</script>

<style lang="scss" scoped>
.your-page {
  padding: 20rpx;
}
</style>
```

#### 调用API
```typescript
// api/your-module.ts
import request from '@/utils/request';

export const apiYourModule = {
  getData() {
    return request.get<YourDataType>('/your-endpoint');
  },
  
  postData(data: any) {
    return request.post('/your-endpoint', data);
  }
};

// 在页面中使用
import { apiYourModule } from '@/api';

async function fetchData() {
  try {
    const result = await apiYourModule.getData();
    console.log(result);
  } catch (error) {
    uni.showToast({
      title: error.message,
      icon: 'none'
    });
  }
}
```

#### 使用Pinia状态
```typescript
// 在页面中使用store
<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { useQuotaStore } from '@/stores/quota';

const userStore = useUserStore();
const quotaStore = useQuotaStore();

// 访问state
console.log(userStore.nickname);
console.log(quotaStore.remaining);

// 调用actions
await userStore.login('wx_code');
await quotaStore.fetchQuota();
</script>
```

---

## 常见问题

### Q1: 数据库连接失败

**现象**: `Error: Can't reach database server at localhost:3306`

**解决方案**:
```bash
# 检查Docker容器状态
docker ps

# 重启MySQL容器
docker-compose restart mysql

# 查看MySQL日志
docker-compose logs mysql
```

### Q2: 微信登录失败

**现象**: `code2session failed`

**解决方案**:
- 检查 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 是否正确
- 确认小程序已在微信公众平台配置服务器域名
- 开发阶段确保「不校验合法域名」已勾选

### Q3: DeepSeek API调用失败

**现象**: `DeepSeek API returned 401`

**解决方案**:
- 检查 `DEEPSEEK_API_KEY` 是否有效
- 确认账户余额充足
- 查看API调用日志：`tail -f backend/logs/ai.log`

### Q4: 小程序支付失败

**现象**: `prepay_id获取失败`

**解决方案**:
- 确认小程序已开通微信支付
- 检查 `WECHAT_MCH_ID` 和 `WECHAT_API_KEY` 配置
- 验证支付回调URL是否已在微信商户平台配置

### Q5: Redis连接失败

**现象**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**解决方案**:
```bash
# 重启Redis
docker-compose restart redis

# 测试Redis连接
redis-cli ping
# 应返回: PONG
```

---

## 测试数据

### 测试用户

种子数据已创建以下测试账户：

| openId | 昵称 | 会员类型 | 配额 |
|--------|------|---------|------|
| test_free_user | 免费用户 | FREE | 20/天 |
| test_monthly_user | 月会员 | MONTHLY | 50/天 |
| test_yearly_user | 年会员 | YEARLY | 无限 |

### 测试支付

使用微信支付沙箱环境：

1. 在微信商户平台申请沙箱密钥
2. 配置沙箱环境的 `WECHAT_API_KEY_SANDBOX`
3. 使用微信开发者工具的「仿真器」测试支付

测试卡号信息：
- 金额：任意正整数（单位：分）
- 测试用例：见微信支付官方文档

---

## 调试技巧

### 后端调试

#### 使用VS Code调试

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/app.ts",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

按 `F5` 开始调试，设置断点即可。

#### 查看日志

```bash
# 实时查看所有日志
tail -f backend/logs/combined.log

# 仅查看错误日志
tail -f backend/logs/error.log

# 查看AI调用日志
tail -f backend/logs/ai.log
```

### uni-app调试

**主要调试方式：微信开发者工具**

1. **Console调试**: 
   - 开发者工具 → Console标签
   - 查看`console.log`输出和错误信息

2. **Network监控**: 
   - 开发者工具 → Network标签
   - 监控API请求和响应

3. **Storage查看**: 
   - 开发者工具 → Storage标签
   - 查看本地存储、Session等

4. **真机调试**: 
   - 点击「真机调试」按钮
   - 用微信扫码连接手机
   - 在真实设备上调试

**VS Code/Cursor调试源码**：
```json
// .vscode/launch.json（用于调试H5版本）
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug H5",
      "url": "http://localhost:8080",
      "webRoot": "${workspaceFolder}/uniapp"
    }
  ]
}
```

**调试技巧**：
- 使用`uni.showToast`快速显示调试信息
- 使用微信开发者工具的Vue DevTools插件查看组件状态
- 在源码中设置`debugger`断点，配合Chrome DevTools使用

### API调试

使用Postman或curl测试API：

```bash
# 登录获取Token
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code"}'

# 使用Token调用API
curl -X GET http://localhost:3000/v1/scenarios \
  -H "Authorization: Bearer your_token"
```

---

## 性能优化建议

### 后端优化

1. **启用Redis缓存**:
```typescript
// services/cache.service.ts
async getScenarios() {
  const cached = await redis.get('scenarios:all');
  if (cached) return JSON.parse(cached);
  
  const scenarios = await prisma.contentScenario.findMany();
  await redis.setex('scenarios:all', 3600, JSON.stringify(scenarios));
  return scenarios;
}
```

2. **数据库查询优化**:
```typescript
// 使用select减少数据传输
const users = await prisma.user.findMany({
  select: { id: true, nickname: true, membershipType: true }
});

// 使用include预加载关联数据
const records = await prisma.contentRecord.findMany({
  include: { scenario: true, user: true }
});
```

3. **并发限流**:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000,  // 1分钟
  max: 10,              // 最多10次请求
  message: '请求过于频繁，请稍后再试'
});

app.use('/v1/content/generate', limiter);
```

### uni-app优化

1. **分包加载**: 在 `pages.json` 中配置subPackages，确保主包<2MB

2. **图片优化**: 
   - 使用WebP格式
   - 启用CDN加速
   - 图片懒加载：`<image lazy-load="true" :src="imgUrl" />`
   - 使用uni-app图片压缩组件

3. **数据缓存**:
```typescript
// utils/cache.ts
export function cacheData(key: string, data: any, ttl = 300000) {
  uni.setStorageSync(key, {
    data,
    expireAt: Date.now() + ttl
  });
}

export function getCachedData(key: string) {
  const cached = uni.getStorageSync(key);
  if (cached && cached.expireAt > Date.now()) {
    return cached.data;
  }
  return null;
}
```

4. **条件编译优化**：
```vue
<!-- 只在小程序端加载某功能 -->
<!-- #ifdef MP-WEIXIN -->
<view>小程序专属内容</view>
<!-- #endif -->

<!-- H5端使用不同组件 -->
<!-- #ifdef H5 -->
<div class="h5-component">H5内容</div>
<!-- #endif -->
```

5. **组件按需引入**：
```typescript
// main.ts - 只引入需要的uni-ui组件
import { createSSRApp } from 'vue';
import * as Pinia from 'pinia';

// 按需引入uni-ui组件
import uniDataPicker from '@/uni_modules/uni-data-picker/components/uni-data-picker/uni-data-picker.vue';
```

---

## 部署指南（简要）

### 后端部署

```bash
# 构建生产版本
pnpm build

# 启动生产服务
NODE_ENV=production pnpm start
```

使用Docker部署：
```bash
docker build -t ai-copywriting-backend .
docker run -d -p 3000:3000 --env-file .env.production ai-copywriting-backend
```

### uni-app小程序发布

**发布流程**：

1. **编译生产版本**：
```bash
cd uniapp
pnpm build:mp-weixin  # 生产环境编译
```

2. **使用微信开发者工具上传**：
   - 用微信开发者工具打开 `uniapp/dist/build/mp-weixin` 目录
   - 点击工具栏的「上传」按钮
   - 填写版本号和项目备注
   - 点击「上传」

3. **在微信公众平台提交审核**：
   - 登录 [微信公众平台](https://mp.weixin.qq.com)
   - 进入「版本管理」→「开发版本」
   - 选择刚上传的版本，点击「提交审核」
   - 填写审核信息（功能描述、测试账号等）

4. **审核通过后发布**：
   - 审核通过后会收到通知
   - 在「版本管理」→「审核版本」中点击「发布」
   - 发布后用户即可使用最新版本

**发布检查清单**：
- [ ] 所有API域名已在微信公众平台配置
- [ ] 支付功能已测试通过
- [ ] 内容审核已通过（无违规内容）
- [ ] 主包大小<2MB，总包大小<20MB
- [ ] 已测试真机运行无异常
- [ ] 已配置正确的隐私协议

---

## 下一步

- 📖 阅读 [API文档](./contracts/api-spec.yaml)
- 📊 查看 [数据模型](./data-model.md)
- 🔬 阅读 [技术研究](./research.md)
- 📝 使用 `/speckit.tasks` 生成开发任务列表

---

## 获取帮助

- **技术问题**: 查看项目Wiki或提交Issue
- **微信小程序**: [官方文档](https://developers.weixin.qq.com/miniprogram/dev/)
- **Prisma**: [官方文档](https://www.prisma.io/docs/)
- **DeepSeek**: [API文档](https://platform.deepseek.com/docs)

---

**Quick Start Complete!** 🎉

现在你应该已经成功运行了开发环境。开始愉快的编码吧！

