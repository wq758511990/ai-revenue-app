# Data Model: AI智能文案助手小程序

**Feature**: 001-ai-copywriting-mini-app  
**Date**: 2025-11-05  
**ORM**: Prisma with MySQL 8.0

## 数据模型概览

本文档定义AI智能文案助手小程序的完整数据模型，包括7个核心实体及其关系。

### Entity Relationship Diagram

```
User (用户账户)
  ├──< UsageQuota (使用配额) [1:1]
  ├──< ContentRecord (文案记录) [1:N]
  ├──< Order (订单记录) [1:N]
  └──< Feedback (用户反馈) [1:N]

ContentScenario (文案场景) 
  └──< ContentRecord (文案记录) [1:N]

ToneStyle (情绪风格配置)
  └──< ContentRecord (引用关系) [通过toneStyle字段]
```

---

## 1. User (用户账户)

### Description
存储微信小程序用户的身份信息和会员状态。

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | 用户唯一标识 |
| openId | String(128) | UNIQUE, NOT NULL | 微信OpenID |
| unionId | String(128) | UNIQUE, NULLABLE | 微信UnionID（跨应用） |
| nickname | String(100) | NULLABLE | 用户昵称 |
| avatarUrl | String(500) | NULLABLE | 头像URL |
| membershipType | Enum | NOT NULL, DEFAULT 'FREE' | 会员类型：FREE, MONTHLY, YEARLY |
| membershipExpireAt | DateTime | NULLABLE | 会员到期时间 |
| purchasedQuota | Integer | DEFAULT 0 | 购买的额外次数余额 |
| createdAt | DateTime | NOT NULL | 创建时间 |
| updatedAt | DateTime | NOT NULL | 更新时间 |
| lastLoginAt | DateTime | NULLABLE | 最后登录时间 |
| status | Enum | DEFAULT 'ACTIVE' | 账户状态：ACTIVE, SUSPENDED, DELETED |

### Indexes

```sql
CREATE INDEX idx_user_openid ON users(open_id);
CREATE INDEX idx_user_membership ON users(membership_type, membership_expire_at);
CREATE INDEX idx_user_status ON users(status, created_at);
```

### Business Rules

1. **会员到期逻辑**：
   - `membershipType = 'FREE'` 时，`membershipExpireAt` 为 NULL
   - `membershipType = 'MONTHLY/YEARLY'` 时，`membershipExpireAt` 必须设置
   - 每日0点定时任务检查过期会员，自动降级为 FREE

2. **购买次数累加**：
   - `purchasedQuota` 仅记录按次购买的剩余次数
   - 不受每日重置影响，持续有效

3. **软删除**：
   - `status = 'DELETED'` 表示逻辑删除
   - 物理删除需符合数据保留政策（如30天后）

---

## 2. ContentScenario (文案生成场景)

### Description
定义不同类型的文案生成场景及其配置。

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | 场景唯一标识 |
| name | String(50) | NOT NULL | 场景名称（如"小红书爆款文案"） |
| slug | String(50) | UNIQUE, NOT NULL | 场景标识符（如"xiaohongshu"） |
| description | Text | NULLABLE | 场景描述 |
| icon | String(200) | NULLABLE | 场景图标URL |
| platform | String(50) | NOT NULL | 目标平台（如"小红书"、"抖音"） |
| inputSchema | JSON | NOT NULL | 输入字段配置（动态表单） |
| systemPrompt | Text | NOT NULL | AI系统提示词模板 |
| defaultToneStyle | String(50) | NOT NULL | 默认情绪风格 |
| maxLength | Integer | DEFAULT 500 | 最大字数限制 |
| sortOrder | Integer | DEFAULT 0 | 显示排序 |
| isActive | Boolean | DEFAULT true | 是否启用 |
| createdAt | DateTime | NOT NULL | 创建时间 |
| updatedAt | DateTime | NOT NULL | 更新时间 |

### Input Schema Example

```json
{
  "fields": [
    {
      "name": "productName",
      "label": "产品名称",
      "type": "text",
      "required": true,
      "placeholder": "请输入产品名称"
    },
    {
      "name": "features",
      "label": "产品特点",
      "type": "textarea",
      "required": true,
      "maxLength": 200
    },
    {
      "name": "targetAudience",
      "label": "目标用户",
      "type": "select",
      "options": ["年轻女性", "职场人士", "学生群体", "中老年人"],
      "required": false
    }
  ]
}
```

### Indexes

```sql
CREATE INDEX idx_scenario_slug ON content_scenarios(slug);
CREATE INDEX idx_scenario_active ON content_scenarios(is_active, sort_order);
```

### Business Rules

1. **预置场景**：
   - 系统初始化时创建12个预置场景
   - `slug` 作为唯一标识，用于前端路由和API调用

2. **动态表单**：
   - `inputSchema` 定义前端动态生成的表单
   - 后端根据schema验证用户输入

3. **Prompt模板**：
   - `systemPrompt` 使用变量占位符，如 `{{productName}}`, `{{features}}`
   - 生成时替换为用户实际输入

---

## 3. ContentRecord (文案记录)

### Description
存储每次文案生成的历史记录。

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | 记录唯一标识 |
| userId | UUID | FOREIGN KEY (User), NOT NULL | 所属用户 |
| scenarioId | UUID | FOREIGN KEY (ContentScenario), NOT NULL | 使用的场景 |
| toneStyle | String(50) | NOT NULL | 使用的情绪风格 |
| userInput | JSON | NOT NULL | 用户输入的原始信息 |
| generatedContent | Text | NOT NULL | AI生成的文案内容 |
| isEdited | Boolean | DEFAULT false | 是否被用户编辑过 |
| editedContent | Text | NULLABLE | 编辑后的内容 |
| generationTime | Integer | NULLABLE | 生成耗时（毫秒） |
| aiModel | String(50) | DEFAULT 'deepseek-chat' | 使用的AI模型 |
| createdAt | DateTime | NOT NULL | 创建时间 |
| updatedAt | DateTime | NOT NULL | 更新时间 |

### Indexes

```sql
CREATE INDEX idx_content_user_time ON content_records(user_id, created_at DESC);
CREATE INDEX idx_content_scenario ON content_records(scenario_id, created_at DESC);
CREATE INDEX idx_content_tone ON content_records(tone_style, created_at DESC);
```

### Business Rules

1. **存储策略**：
   - 保留所有历史记录，不删除（用于数据分析）
   - 用户可见范围：最近30天或最近100条

2. **编辑追踪**：
   - 用户编辑后，`isEdited = true`
   - 原始生成内容保留在 `generatedContent`
   - 编辑后内容存储在 `editedContent`

3. **性能监控**：
   - `generationTime` 用于监控AI响应性能
   - 异常慢的请求（>10秒）触发告警

---

## 4. UsageQuota (使用配额)

### Description
管理用户每日使用次数配额。

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | 配额记录ID |
| userId | UUID | FOREIGN KEY (User), UNIQUE, NOT NULL | 所属用户 |
| dailyLimit | Integer | NOT NULL | 每日限额（根据会员类型） |
| usedToday | Integer | DEFAULT 0 | 今日已使用次数 |
| lastResetDate | Date | NOT NULL | 最后重置日期 |
| createdAt | DateTime | NOT NULL | 创建时间 |
| updatedAt | DateTime | NOT NULL | 更新时间 |

### Indexes

```sql
CREATE UNIQUE INDEX idx_quota_user ON usage_quota(user_id);
CREATE INDEX idx_quota_reset_date ON usage_quota(last_reset_date);
```

### Business Rules

1. **配额计算逻辑**：
   ```javascript
   // 实际可用次数 = min(每日限额 - 今日已用, 购买的额外次数)
   availableQuota = Math.max(
     dailyLimit - usedToday,  // 每日剩余
     0
   ) + user.purchasedQuota;    // 加上购买的次数
   ```

2. **重置机制**：
   - 每日0点定时任务：
     - 如果 `lastResetDate < today`，则 `usedToday = 0`, `lastResetDate = today`
   - 首次访问时检查：
     - 如果 `lastResetDate < today`，自动重置

3. **消费顺序**：
   - 优先消耗每日免费额度
   - 免费额度用完后消耗 `purchasedQuota`

---

## 5. Order (订单记录)

### Description
存储会员购买和按次付费的订单信息。

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | 订单ID |
| orderNo | String(32) | UNIQUE, NOT NULL | 订单号（用于微信支付） |
| userId | UUID | FOREIGN KEY (User), NOT NULL | 购买用户 |
| orderType | Enum | NOT NULL | 订单类型：MEMBERSHIP, PAY_PER_USE |
| membershipType | Enum | NULLABLE | 会员类型（如orderType=MEMBERSHIP） |
| quantity | Integer | DEFAULT 1 | 购买次数（按次付费时使用） |
| amount | Decimal(10,2) | NOT NULL | 订单金额（元） |
| status | Enum | NOT NULL | 订单状态：PENDING, PAID, REFUNDED, CANCELLED |
| paymentMethod | String(50) | DEFAULT 'WECHAT_PAY' | 支付方式 |
| transactionId | String(100) | NULLABLE | 微信支付交易号 |
| paidAt | DateTime | NULLABLE | 支付完成时间 |
| refundedAt | DateTime | NULLABLE | 退款时间 |
| refundReason | Text | NULLABLE | 退款原因 |
| createdAt | DateTime | NOT NULL | 创建时间 |
| updatedAt | DateTime | NOT NULL | 更新时间 |

### Indexes

```sql
CREATE UNIQUE INDEX idx_order_no ON orders(order_no);
CREATE INDEX idx_order_user_status ON orders(user_id, status, created_at DESC);
CREATE INDEX idx_order_status ON orders(status, created_at DESC);
CREATE INDEX idx_order_transaction ON orders(transaction_id);
```

### Business Rules

1. **订单号生成**：
   ```javascript
   // 格式：yyyyMMddHHmmss + 6位随机数
   orderNo = `${moment().format('YYYYMMDDHHmmss')}${randomString(6)}`;
   ```

2. **支付回调处理**：
   - 微信支付回调后，验证签名
   - 更新 `status = 'PAID'`, `paidAt = now()`
   - 根据 `orderType` 更新用户会员状态或配额

3. **退款逻辑**：
   - 年会员支持7天无理由退款
   - 月会员支持3天退款
   - 按次购买不支持退款

---

## 6. Feedback (用户反馈)

### Description
存储用户提交的意见和建议。

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | 反馈ID |
| userId | UUID | FOREIGN KEY (User), NOT NULL | 提交用户 |
| feedbackType | Enum | NOT NULL | 反馈类型：NEW_TONE, NEW_SCENARIO, FEATURE_REQUEST, BUG_REPORT |
| content | Text | NOT NULL | 反馈内容（最多200字） |
| status | Enum | DEFAULT 'SUBMITTED' | 状态：SUBMITTED, IN_PROGRESS, ADOPTED, REPLIED, CLOSED |
| adminReply | Text | NULLABLE | 官方回复内容 |
| repliedAt | DateTime | NULLABLE | 回复时间 |
| repliedBy | String(100) | NULLABLE | 回复人员 |
| priority | Integer | DEFAULT 0 | 优先级（内部使用，0-10） |
| createdAt | DateTime | NOT NULL | 提交时间 |
| updatedAt | DateTime | NOT NULL | 更新时间 |

### Indexes

```sql
CREATE INDEX idx_feedback_user_type ON feedbacks(user_id, feedback_type, created_at DESC);
CREATE INDEX idx_feedback_status ON feedbacks(status, priority DESC, created_at DESC);
CREATE INDEX idx_feedback_type ON feedbacks(feedback_type, status);
```

### Business Rules

1. **内容验证**：
   - 提交时检查：`content.length >= 5 && content.length <= 200`
   - 基础敏感词过滤

2. **状态流转**：
   ```
   SUBMITTED → IN_PROGRESS → ADOPTED/REPLIED → CLOSED
                          → CLOSED（不采纳）
   ```

3. **优先级评分**：
   - 由后台管理员手动设置
   - 高优先级（8-10）：紧急bug或高频需求
   - 中优先级（4-7）：功能建议
   - 低优先级（1-3）：一般反馈

---

## 7. ToneStyle (情绪风格配置)

### Description
存储可选的文案表达风格类型，支持动态配置和扩展新风格。

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | 风格唯一标识 |
| name | String(50) | NOT NULL | 风格名称（如"热情洋溢"） |
| slug | String(50) | UNIQUE, NOT NULL | 风格代码（如"ENTHUSIASTIC"） |
| description | Text | NULLABLE | 风格描述说明 |
| promptModifier | Text | NOT NULL | Prompt修饰符（用于调整AI生成语气） |
| sortOrder | Integer | DEFAULT 0 | 显示排序（数字越小越靠前） |
| isActive | Boolean | DEFAULT true | 是否启用 |
| createdAt | DateTime | NOT NULL | 创建时间 |
| updatedAt | DateTime | NOT NULL | 更新时间 |

### Indexes

```sql
CREATE INDEX idx_tone_style_active_sort ON tone_styles(is_active, sort_order);
```

### Business Rules

1. **默认风格**：
   - 系统初始化5种风格：
     - ENTHUSIASTIC (热情洋溢)
     - PROFESSIONAL (专业严谨)
     - HUMOROUS (轻松幽默)
     - GENTLE (温柔亲和)
     - CONCISE (简洁直接)

2. **Prompt修饰符格式**：
   - `promptModifier` 字段存储用于调整AI语气的描述文本
   - 示例：`"请使用热情洋溢的语气，多用感叹号和情绪化表达"`
   - 在生成文案时，将此修饰符追加到系统Prompt中

3. **扩展性设计**：
   - 支持后续通过管理后台动态添加新风格
   - 禁用风格不显示在前端选择列表中，但历史记录仍可查看

4. **排序规则**：
   - `sortOrder` 数值越小，前端显示时越靠前
   - 默认按 `sortOrder ASC, createdAt ASC` 排序

---

## Prisma Schema

以下是完整的Prisma Schema定义：

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// 用户账户
model User {
  id                  String        @id @default(uuid())
  openId              String        @unique @map("open_id") @db.VarChar(128)
  unionId             String?       @unique @map("union_id") @db.VarChar(128)
  nickname            String?       @db.VarChar(100)
  avatarUrl           String?       @map("avatar_url") @db.VarChar(500)
  membershipType      MembershipType @default(FREE) @map("membership_type")
  membershipExpireAt  DateTime?     @map("membership_expire_at")
  purchasedQuota      Int           @default(0) @map("purchased_quota")
  status              UserStatus    @default(ACTIVE)
  lastLoginAt         DateTime?     @map("last_login_at")
  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")

  quota               UsageQuota?
  contentRecords      ContentRecord[]
  orders              Order[]
  feedbacks           Feedback[]

  @@index([openId])
  @@index([membershipType, membershipExpireAt])
  @@map("users")
}

// 文案生成场景
model ContentScenario {
  id              String   @id @default(uuid())
  name            String   @db.VarChar(50)
  slug            String   @unique @db.VarChar(50)
  description     String?  @db.Text
  icon            String?  @db.VarChar(200)
  platform        String   @db.VarChar(50)
  inputSchema     Json     @map("input_schema")
  systemPrompt    String   @map("system_prompt") @db.Text
  defaultToneStyle String  @default("ENTHUSIASTIC") @map("default_tone_style") @db.VarChar(50)
  maxLength       Int      @default(500) @map("max_length")
  sortOrder       Int      @default(0) @map("sort_order")
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  contentRecords  ContentRecord[]

  @@index([slug])
  @@index([isActive, sortOrder])
  @@map("content_scenarios")
}

// 情绪风格配置
model ToneStyle {
  id              String   @id @default(uuid())
  name            String   @db.VarChar(50)
  slug            String   @unique @db.VarChar(50)
  description     String?  @db.Text
  promptModifier  String   @map("prompt_modifier") @db.Text
  sortOrder       Int      @default(0) @map("sort_order")
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([isActive, sortOrder])
  @@map("tone_styles")
}

// 文案记录
model ContentRecord {
  id                String          @id @default(uuid())
  userId            String          @map("user_id")
  scenarioId        String          @map("scenario_id")
  toneStyle         String          @map("tone_style") @db.VarChar(50)
  userInput         Json            @map("user_input")
  generatedContent  String          @map("generated_content") @db.Text
  isEdited          Boolean         @default(false) @map("is_edited")
  editedContent     String?         @map("edited_content") @db.Text
  generationTime    Int?            @map("generation_time")
  aiModel           String          @default("deepseek-chat") @map("ai_model") @db.VarChar(50)
  createdAt         DateTime        @default(now()) @map("created_at")
  updatedAt         DateTime        @updatedAt @map("updated_at")

  user              User            @relation(fields: [userId], references: [id])
  scenario          ContentScenario @relation(fields: [scenarioId], references: [id])

  @@index([userId, createdAt(sort: Desc)])
  @@index([scenarioId, createdAt(sort: Desc)])
  @@index([toneStyle, createdAt(sort: Desc)])
  @@map("content_records")
}

// 使用配额
model UsageQuota {
  id            String   @id @default(uuid())
  userId        String   @unique @map("user_id")
  dailyLimit    Int      @map("daily_limit")
  usedToday     Int      @default(0) @map("used_today")
  lastResetDate DateTime @map("last_reset_date") @db.Date
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user          User     @relation(fields: [userId], references: [id])

  @@index([lastResetDate])
  @@map("usage_quota")
}

// 订单记录
model Order {
  id              String         @id @default(uuid())
  orderNo         String         @unique @map("order_no") @db.VarChar(32)
  userId          String         @map("user_id")
  orderType       OrderType      @map("order_type")
  membershipType  MembershipType? @map("membership_type")
  quantity        Int            @default(1)
  amount          Decimal        @db.Decimal(10, 2)
  status          OrderStatus    @default(PENDING)
  paymentMethod   String         @default("WECHAT_PAY") @map("payment_method") @db.VarChar(50)
  transactionId   String?        @map("transaction_id") @db.VarChar(100)
  paidAt          DateTime?      @map("paid_at")
  refundedAt      DateTime?      @map("refunded_at")
  refundReason    String?        @map("refund_reason") @db.Text
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  user            User           @relation(fields: [userId], references: [id])

  @@index([orderNo])
  @@index([userId, status, createdAt(sort: Desc)])
  @@index([status, createdAt(sort: Desc)])
  @@index([transactionId])
  @@map("orders")
}

// 用户反馈
model Feedback {
  id            String       @id @default(uuid())
  userId        String       @map("user_id")
  feedbackType  FeedbackType @map("feedback_type")
  content       String       @db.Text
  status        FeedbackStatus @default(SUBMITTED)
  adminReply    String?      @map("admin_reply") @db.Text
  repliedAt     DateTime?    @map("replied_at")
  repliedBy     String?      @map("replied_by") @db.VarChar(100)
  priority      Int          @default(0)
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")

  user          User         @relation(fields: [userId], references: [id])

  @@index([userId, feedbackType, createdAt(sort: Desc)])
  @@index([status, priority(sort: Desc), createdAt(sort: Desc)])
  @@index([feedbackType, status])
  @@map("feedbacks")
}

// 枚举类型
enum MembershipType {
  FREE
  MONTHLY
  YEARLY
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum OrderType {
  MEMBERSHIP
  PAY_PER_USE
}

enum OrderStatus {
  PENDING
  PAID
  REFUNDED
  CANCELLED
}

enum FeedbackType {
  NEW_TONE
  NEW_SCENARIO
  FEATURE_REQUEST
  BUG_REPORT
}

enum FeedbackStatus {
  SUBMITTED
  IN_PROGRESS
  ADOPTED
  REPLIED
  CLOSED
}
```

---

## 数据迁移策略

### Initial Migration

```bash
# 生成初始迁移
npx prisma migrate dev --name init

# 生成Prisma Client
npx prisma generate
```

### Seed Data

```javascript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 创建12个预置场景
  const scenarios = [
    {
      slug: 'xiaohongshu',
      name: '小红书爆款文案',
      platform: '小红书',
      defaultToneStyle: 'ENTHUSIASTIC',
      inputSchema: { /* ... */ },
      systemPrompt: '你是一名专业的小红书文案撰写助手...'
    },
    // ... 其他11个场景
  ];

  for (const scenario of scenarios) {
    await prisma.contentScenario.upsert({
      where: { slug: scenario.slug },
      update: {},
      create: scenario
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 数据安全与隐私

### 敏感数据加密

- **用户OpenID**: 存储原文（用于微信API调用）
- **支付信息**: 仅存储订单号和交易ID，不存储支付密码
- **用户生成内容**: 明文存储，便于内容审核

### 数据备份策略

- **全量备份**: 每日凌晨3点
- **增量备份**: 每小时
- **保留周期**: 全量30天，增量7天

### GDPR合规（如需国际化）

- 提供用户数据导出功能
- 支持用户注销和数据删除请求
- 明确数据使用目的和范围

---

**Phase 1 Part 1 Complete** - 数据模型设计完成，包含6个核心实体和完整的Prisma Schema。

