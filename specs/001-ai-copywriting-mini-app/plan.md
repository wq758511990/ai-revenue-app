# Implementation Plan: AI智能文案助手小程序

**Branch**: `001-ai-copywriting-mini-app` | **Date**: 2025-11-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-copywriting-mini-app/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

构建一个AI智能文案助手微信小程序，为营销人员和内容创作者提供12种场景的文案生成服务。核心差异化功能是情绪风格选择（热情洋溢、专业严谨、轻松幽默、温柔亲和、简洁直接），让用户能够为相同内容快速生成不同表达风格的文案。采用前后端分离架构，后端基于Node.js提供API服务和AI能力集成，前端使用uni-app框架（Vue 3 + TypeScript），通过会员订阅和按次付费实现商业变现。

## Technical Context

**Language/Version**: 
- 后端: Node.js 18+ with TypeScript 5.0+
- 前端: uni-app 3.x (Vue 3 + TypeScript + Vite)

**Primary Dependencies**: 
- 后端: Express.js/Koa2, Prisma ORM, DeepSeek SDK, node-cache
- 前端: Vue 3, Pinia, uni-ui 组件库

**Storage**: 
- 主数据库: MySQL 8.0+ (用户、订单、文案记录、反馈)
- 缓存: Redis 6+ (会话、配额计数)
- 文件存储: 微信云存储 / 阿里云OSS (日志、备份)

**Testing**: 第一期不实现自动化测试，采用手动测试验证功能

**Target Platform**: 
- 服务端: Linux服务器 (支持Docker部署)
- 客户端: 微信小程序 (iOS/Android)，uni-app可扩展至H5/App

**Project Type**: mobile (uni-app + 后端API)

**Performance Goals**: 
- AI文案生成响应: <5秒 (90%情况)
- API响应时间: <200ms (非AI接口)
- 支持500并发用户
- 小程序启动时间: <2秒

**Constraints**: 
- 微信支付集成必须符合微信商户平台规范
- 内容必须通过微信内容安全审核
- 数据存储遵循PIPL个人信息保护法
- AI生成内容需要内容审核机制

**Scale/Scope**: 
- 初期目标: 1万+ 日活用户
- 12个文案生成场景
- 5种情绪风格
- 支持历史记录、会员体系、用户反馈等完整功能

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 安全性要求
- ✅ **内容安全审核**: 集成微信内容安全API，过滤违规内容
- ✅ **用户认证**: 基于微信openid的用户身份验证机制
- ✅ **支付安全**: 遵循微信支付安全规范，验证支付回调签名
- ✅ **敏感数据保护**: 用户信息、订单数据需加密存储
- ✅ **API安全**: 实现请求签名、频率限制、防重放攻击

### 性能要求
- ✅ **响应时间**: 非AI接口P95<200ms，AI生成接口P90<5秒
- ✅ **并发支持**: 支持至少500并发用户
- ✅ **缓存策略**: 使用Redis缓存配额计数、场景配置等热点数据
- ✅ **数据库优化**: 关键查询需要建立索引，避免全表扫描

### 可维护性要求
- ✅ **代码规范**: 使用ESLint + Prettier统一代码风格
- ✅ **TypeScript严格模式**: 启用strict模式，确保类型安全
- ✅ **日志系统**: 结构化日志，记录关键操作和错误信息
- ✅ **环境配置**: 使用环境变量管理配置，支持dev/staging/prod环境
- ✅ **API文档**: 使用OpenAPI/Swagger生成API文档

### 业务完整性
- ✅ **事务处理**: 支付、配额扣减等关键操作需要事务保证
- ✅ **幂等性**: 支付回调、文案生成等接口需要实现幂等性
- ✅ **错误恢复**: 生成失败不扣配额，支付失败有重试机制
- ✅ **数据一致性**: 多设备登录时配额、会员状态保持一致

**Initial Assessment**: ✅ PASS - 所有核心要求已明确，第一期不包含自动化测试

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
ai-revenue-app/
├── backend/                          # 后端API服务
│   ├── src/
│   │   ├── controllers/              # API控制器层
│   │   │   ├── auth.controller.ts
│   │   │   ├── content.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   └── feedback.controller.ts
│   │   ├── services/                 # 业务逻辑层
│   │   │   ├── ai.service.ts         # AI文案生成服务
│   │   │   ├── quota.service.ts      # 配额管理服务
│   │   │   ├── payment.service.ts    # 支付服务
│   │   │   ├── content.service.ts    # 内容管理服务
│   │   │   ├── feedback.service.ts   # 反馈服务
│   │   │   └── security.service.ts   # 内容安全审核服务
│   │   ├── models/                   # 数据模型 (Prisma)
│   │   │   └── schema.prisma
│   │   ├── middleware/               # 中间件
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rateLimit.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── utils/                    # 工具函数
│   │   │   ├── logger.ts
│   │   │   ├── crypto.ts
│   │   │   └── validator.ts
│   │   ├── config/                   # 配置文件
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── wechat.ts
│   │   └── app.ts                    # 应用入口
│   ├── prisma/                       # Prisma配置
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                         # uni-app前端
│   ├── pages/                        # 页面
│   │   ├── index/                    # 首页
│   │   ├── generate/                 # 文案生成页
│   │   └── result/                   # 结果页
│   ├── pages-sub/                    # 分包页面
│   │   ├── membership/               # 会员中心
│   │   └── profile/                  # 个人中心（历史、反馈）
│   ├── components/                   # 组件
│   │   ├── ToneSelector.vue          # 情绪风格选择器
│   │   ├── ScenarioCard.vue          # 场景卡片
│   │   ├── ContentPreview.vue        # 文案预览
│   │   ├── QuotaDisplay.vue          # 配额显示
│   │   └── DynamicForm.vue           # 动态表单
│   ├── stores/                       # Pinia状态管理
│   │   ├── user.ts                   # 用户状态
│   │   ├── quota.ts                  # 配额状态
│   │   └── scenario.ts               # 场景状态
│   ├── api/                          # API调用
│   │   ├── auth.ts
│   │   ├── content.ts
│   │   ├── payment.ts
│   │   └── index.ts
│   ├── utils/                        # 工具函数
│   │   ├── request.ts                # 请求封装
│   │   └── clipboard.ts              # 剪贴板
│   ├── static/                       # 静态资源
│   ├── uni_modules/                  # uni-app插件
│   ├── App.vue
│   ├── main.ts
│   ├── pages.json
│   ├── manifest.json
│   └── vite.config.ts
│
├── docs/                             # 项目文档
│   └── api/                          # API文档
│
└── specs/                            # 规格说明
    └── 001-ai-copywriting-mini-app/
```

**Structure Decision**: 采用移动应用 + API 的结构（uni-app + 后端API）。前端使用 `frontend/` 目录存放 uni-app 项目（Vue 3 + TypeScript + Pinia），后端API服务使用 `backend/` 目录（Node.js + TypeScript + Prisma）。这种结构清晰分离前后端，便于独立开发和部署。uni-app 的优势是可扩展至H5和App平台，提供更好的跨平台能力。第一期不包含测试目录，后续可扩展添加。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无违规项 - Constitution Check 全部通过，无需复杂度追踪。

---

## Phase 0: Research & Technology Selection

✅ **已完成** - 详见 [research.md](./research.md)

关键技术决策：
- **AI服务**: 
  - 主力: DeepSeek (用户现有资源)
  - 备用1: 硅基流动 (每月100万tokens免费额度)
  - 备用2: Groq API (每日免费额度，速度极快)
- **支付**: 微信支付V3 API
- **内容审核**: 微信内容安全API + 本地敏感词过滤
- **配额管理**: Redis + MySQL 双存储
- **数据库**: Prisma ORM + MySQL 8.0
- **前端框架**: uni-app 3.x (Vue 3 + Pinia + TypeScript)

---

## Phase 1: Design & Contracts

接下来将生成：
1. `data-model.md` - 数据模型设计
2. `contracts/api-spec.yaml` - API接口规范
3. `quickstart.md` - 快速开始指南
