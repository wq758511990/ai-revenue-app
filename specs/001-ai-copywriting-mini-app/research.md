# Research Document: AI智能文案助手小程序技术调研

**Feature**: 001-ai-copywriting-mini-app  
**Date**: 2025-11-05  
**Purpose**: 解决技术选型和实现方案的关键技术问题

## 调研概览

本文档涵盖AI智能文案助手小程序的关键技术决策，包括AI集成、支付系统、数据存储、性能优化等方面的研究成果。

---

## 1. DeepSeek API 集成方案

### Decision
使用 **DeepSeek Chat API** 进行文案生成，通过System Prompt + User Prompt模式实现场景和情绪风格控制。

### Rationale
1. **成本效益**：DeepSeek API价格约0.001元/次调用，符合预算（单用户成本0.5-1元/月）
2. **响应速度**：平均响应时间2-4秒，满足"90%请求<5秒"的性能要求
3. **中文优化**：DeepSeek对中文营销文案生成质量高，适合本地化需求
4. **灵活性**：支持通过Prompt工程实现不同场景和情绪风格的控制

### Implementation Pattern

```javascript
// services/ai.service.ts
async generateContent(scenario, toneStyle, userInput) {
  const systemPrompt = this.buildSystemPrompt(scenario, toneStyle);
  const userPrompt = this.buildUserPrompt(userInput);
  
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,  // 保持创意性
    max_tokens: 500    // 限制输出长度
  });
  
  return this.processResponse(response);
}
```

### Prompt Engineering Strategy

**核心原则：模仿真人口吻，避免AI腔调**

关键要点：
1. **自然表达**：像真人说话一样，有语气词、口语化表达
2. **情感真实**：不刻意堆砌形容词，情感流露自然
3. **避免套路**：不用"让我们一起"、"不容错过"等AI常用套话
4. **保持真诚**：不夸大其词，实事求是地描述

**System Prompt 结构**：
```
你是一个真实的{身份}，正在为朋友推荐{场景}。

## 你的说话方式
{情绪风格的自然描述 - 用第一人称，描述真实的表达习惯}

## 写作要求
- 像平时说话一样自然，不要用"让我们一起"、"不容错过"这类营销套话
- 不堆砌形容词，一个词能说清就不用两个
- 可以用"哈哈"、"嗯"、"真的"这类语气词，让语言更生动
- 适当用emoji，但别每句话都加
- 字数控制在{字数范围}
- 目标平台：{平台特征}

## 禁止
- AI味浓重的表达（如"让我们一起"、"不容错过"、"值得一试"）
- 过度夸张（如"惊艳"、"完美"、"绝对"）
- 刻意的排比句和对称句式
```

**5种情绪风格的自然化Prompt定义**：

**1. 热情洋溢**：
```
我平时说话就比较兴奋哈哈，看到好东西总是忍不住跟朋友分享！我会：
- 真心实意地表达喜欢，但不会夸张到"完美"、"绝对"这种词
- 用"真的超级"、"我的天"、"太爱了"这类自然的感叹
- 适当用感叹号，但不会每句都加
- 分享具体的感受和细节，而不是空洞的赞美

❌ 避免：让我们一起、不容错过、绝对惊艳、完美无瑕
✅ 推荐：真的好用诶、我超爱、这个太棒了、必须安利
```

**2. 专业严谨**：
```
我是做这行的，说话比较客观实在，看重事实和数据。我会：
- 用平实的语言陈述事实，不煽情
- 提到具体的参数、对比、使用场景
- 语气平和，不用感叹号和emoji
- 承认优缺点，不一味夸赞

❌ 避免：惊艳、完美、绝对、必买
✅ 推荐：从数据看、实测结果、相比之下、综合考虑
```

**3. 轻松幽默**：
```
我这人比较逗比，喜欢用轻松的方式说事儿，但不会刻意抖机灵。我会：
- 用点自嘲和调侃，让气氛轻松
- 适当用网络用语，但不过时
- 用"哈哈"、"啦"这类语气词
- 保持分寸，不油腻不尴尬

❌ 避免：哈哈哈哈哈（过度）、强行押韵、尴尬的谐音梗
✅ 推荐：真香警告、yyds但要低调、懂的都懂、钱包准备好了吗
```

**4. 温柔亲和**：
```
我说话比较温柔，像跟闺蜜聊天那样，会考虑对方的感受。我会：
- 用"可以试试"、"我觉得"这类委婉表达
- 适当问问题，跟读者互动
- 语气温和，多用"呢"、"哦"、"呀"
- 分享个人经历，让人觉得亲近

❌ 避免：命令式语气、过度甜腻、假装亲密
✅ 推荐：你可以试试、我自己用着不错、或许适合你、要不要试试看
```

**5. 简洁直接**：
```
我说话比较直接，不喜欢绕圈子，能一句话说清就不说两句。我会：
- 开门见山，直接说重点
- 用短句，少用形容词
- 没有废话和铺垫
- 实用信息为主

❌ 避免：长句、堆砌词藻、煽情铺垫
✅ 推荐：直接说结论、3个要点、看这里、记住这个
```

### 实际案例对比

**场景：推荐口红**

**❌ AI味重的写法**：
```
姐妹们！今天给大家安利一款让人惊艳的口红！这款口红的色号真的是绝绝子，完美的显白效果让你瞬间提升气质！不容错过的宝藏单品，让我们一起变美吧！
```

**✅ 自然的写法（热情洋溢风格）**：
```
哇我要吹爆这支口红！！上嘴那一刻我真的震惊了，这个色号也太适合黄皮了吧😭 之前试了好多显白的都翻车，这支是真的可以！不厚重不拔干，素颜涂也不突兀。姐妹们有空真的可以去专柜试试，我是回购第三支了哈哈
```

**✅ 自然的写法（专业严谨风格）**：
```
这支口红实测下来几个点值得说：1. 色号R02偏暖调，适合暖皮和中性皮；2. 持久度6小时不沾杯，吃饭会掉色；3. 滋润度中等，秋冬建议打底；4. 价格230元，同价位里算中上水平。总体看性价比可以，但不是必买款。
```

### 备用方案：免费AI模型

为确保服务稳定性，配置2个免费AI服务作为备用：

#### 备用方案1：硅基流动 (SiliconFlow)
- **免费额度**: 每月100万tokens
- **模型选择**: Qwen/Qwen2.5-7B-Instruct (中文优化)
- **响应速度**: 2-3秒
- **适用场景**: DeepSeek不可用时自动切换
- **API接口**: 兼容OpenAI格式

```typescript
// 配置示例
const siliconflow = {
  baseURL: 'https://api.siliconflow.cn/v1',
  apiKey: process.env.SILICONFLOW_API_KEY,
  model: 'Qwen/Qwen2.5-7B-Instruct',
  freeQuota: 1000000 // tokens/month
};
```

#### 备用方案2：Groq API
- **免费额度**: 每日14,400次请求 (约30万tokens)
- **模型选择**: llama-3.1-8b-instant
- **响应速度**: 极快 (<1秒)
- **适用场景**: 需要快速响应时
- **优势**: 速度最快的免费API

```typescript
// 配置示例
const groq = {
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.1-8b-instant',
  dailyLimit: 14400 // requests/day
};
```

#### 自动降级策略

```typescript
async function generateWithFallback(prompt: string) {
  const providers = [
    { name: 'DeepSeek', service: deepseekService },
    { name: 'SiliconFlow', service: siliconflowService },
    { name: 'Groq', service: groqService }
  ];
  
  for (const provider of providers) {
    try {
      logger.info(`尝试使用 ${provider.name}`);
      const result = await provider.service.generate(prompt);
      return result;
    } catch (error) {
      logger.warn(`${provider.name} 失败，切换到下一个`, error);
      continue;
    }
  }
  
  throw new Error('所有AI服务不可用');
}
```

### Alternatives Considered
- **OpenAI GPT-4**: 成本高（约0.03美元/1K tokens），不符合成本预算
- **文心一言**: API稳定性不如DeepSeek，调用限制较多
- **通义千问**: 中文能力强但商业化限制多，不适合C端产品
- **Claude**: 无免费额度，成本较高

---

## 2. 微信小程序支付集成

### Decision
使用 **微信小程序支付 JSAPI** 模式，后端统一下单，前端调起支付。

### Rationale
1. **官方支持**：微信提供完整的SDK和文档，稳定性高
2. **用户体验**：无需跳转外部页面，支付流程流畅
3. **手续费**：0.6%费率，行业标准水平
4. **安全性**：支付过程由微信安全体系保障

### Implementation Flow

```
1. 用户选择会员套餐 → 小程序调用后端API
2. 后端生成订单 → 调用微信统一下单API
3. 后端返回支付参数 → 小程序调用 wx.requestPayment()
4. 用户完成支付 → 微信发送支付回调到后端
5. 后端验证签名 → 更新订单状态和用户会员信息
6. 前端轮询或WebSocket → 更新UI显示支付成功
```

### Key Integration Points

**后端**:
```javascript
// services/payment.service.ts
async createOrder(userId, membershipType, amount) {
  // 1. 创建本地订单
  const order = await prisma.order.create({
    data: { userId, membershipType, amount, status: 'PENDING' }
  });
  
  // 2. 调用微信统一下单
  const prepayId = await wechatPay.transactions.native({
    appid: config.wechat.appId,
    mchid: config.wechat.mchId,
    description: `会员订阅 - ${membershipType}`,
    out_trade_no: order.orderNo,
    amount: { total: amount * 100 }, // 转为分
    notify_url: config.wechat.notifyUrl
  });
  
  return { orderId: order.id, prepayId };
}
```

**前端**:
```javascript
// services/payment.service.js
async payForMembership(membershipType) {
  // 1. 获取支付参数
  const { orderId, prepayId } = await api.createOrder(membershipType);
  
  // 2. 调起支付
  const result = await wx.requestPayment({
    timeStamp: String(Date.now()),
    nonceStr: generateNonce(),
    package: `prepay_id=${prepayId}`,
    signType: 'RSA',
    paySign: generateSign(/* ... */)
  });
  
  // 3. 支付成功后轮询订单状态
  return this.pollOrderStatus(orderId);
}
```

### Alternatives Considered
- **支付宝小程序支付**: 微信生态内只能使用微信支付
- **第三方聚合支付**: 增加中间环节，不符合微信小程序规范

---

## 3. 数据库设计与ORM选择

### Decision
使用 **Prisma ORM + MySQL 8.0**，Redis作为缓存层。

### Rationale
1. **Type Safety**: Prisma提供完整的TypeScript类型支持，减少运行时错误
2. **Migration Management**: 自动生成和管理数据库迁移
3. **Query Performance**: Prisma生成优化的SQL查询
4. **Developer Experience**: 自动补全、查询构建器，开发效率高
5. **MySQL生态**: 成熟稳定，支持事务、索引优化

### Database Schema Strategy

**核心表设计原则**：
1. 使用UUID作为主键（防止ID预测）
2. 所有表包含 `createdAt` 和 `updatedAt` 时间戳
3. 软删除策略（`deletedAt`字段）用于重要数据
4. 合理建立外键约束和索引

**关键索引策略**：
```sql
-- 用户配额查询（高频）
CREATE INDEX idx_user_quota_date ON usage_quota(user_id, last_reset_date);

-- 文案历史查询（按时间倒序）
CREATE INDEX idx_content_user_time ON content_records(user_id, created_at DESC);

-- 订单状态查询
CREATE INDEX idx_order_status ON orders(user_id, status, created_at DESC);

-- 反馈类型查询
CREATE INDEX idx_feedback_type_status ON feedbacks(user_id, feedback_type, status);
```

### Redis Caching Strategy

**缓存场景**：
1. **用户会话**: `session:{openid}` (TTL: 7天)
2. **配额缓存**: `quota:{userId}:{date}` (TTL: 24小时)
3. **场景配置**: `scenarios:all` (TTL: 1小时，后台更新时刷新)
4. **限流计数**: `ratelimit:{userId}:{endpoint}` (TTL: 60秒)
5. **热门文案**: `hot:content:{scenarioId}` (TTL: 30分钟)

**缓存更新策略**：
- **Cache-Aside Pattern**: 先查缓存，未命中则查数据库并写入缓存
- **Write-Through**: 更新会员状态等关键数据时同步更新缓存
- **Cache Invalidation**: 订单完成、配额重置时主动清除相关缓存

### Alternatives Considered
- **Sequelize**: 功能完整但TypeScript支持不如Prisma
- **TypeORM**: 类似Prisma但迁移管理较弱
- **MongoDB**: 不适合支付订单等强事务性数据
- **PostgreSQL**: 功能更强但团队对MySQL更熟悉

---

## 4. 限流与配额管理

### Decision
使用 **Redis + Token Bucket算法** 实现分布式限流和配额管理。

### Rationale
1. **精确控制**: Token Bucket能精确控制每日配额和突发流量
2. **分布式支持**: Redis原子操作保证多实例一致性
3. **高性能**: Redis内存操作，响应时间<1ms
4. **灵活配置**: 支持不同用户级别的配额策略

### Implementation Pattern

```javascript
// services/quota.service.ts
async checkAndConsumeQuota(userId, membershipType) {
  const today = moment().format('YYYY-MM-DD');
  const key = `quota:${userId}:${today}`;
  
  // 获取当前配额
  let current = await redis.get(key);
  
  if (!current) {
    // 首次访问，初始化配额
    const limit = this.getQuotaLimit(membershipType);
    await redis.setex(key, 86400, limit); // 24小时过期
    current = limit;
  }
  
  current = parseInt(current);
  
  if (current <= 0) {
    throw new QuotaExceeded('今日配额已用完');
  }
  
  // 原子递减
  await redis.decr(key);
  
  return { remaining: current - 1 };
}

// 获取配额限制
getQuotaLimit(membershipType) {
  switch (membershipType) {
    case 'FREE': return 20;
    case 'MONTHLY': return 50;
    case 'YEARLY': return 999999; // 事实上的无限
    default: return 0;
  }
}
```

### Rate Limiting for API Protection

```javascript
// middlewares/ratelimit.middleware.ts
async function rateLimitMiddleware(req, res, next) {
  const userId = req.user.id;
  const endpoint = req.path;
  const key = `ratelimit:${userId}:${endpoint}`;
  
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 60); // 1分钟窗口
  }
  
  if (current > 10) { // 每分钟最多10次
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  next();
}
```

### Alternatives Considered
- **Leaky Bucket**: 平滑流量但不适合每日配额场景
- **Fixed Window**: 简单但有临界时刻突发问题
- **数据库计数**: 性能差，无法应对高并发

---

## 5. 内容安全审核方案

### Decision
使用 **微信内容安全API + 自定义关键词过滤** 双重审核机制。

### Rationale
1. **合规要求**: 微信小程序必须通过内容审核
2. **官方支持**: 微信提供免费的内容安全API
3. **响应速度**: 异步审核不阻塞用户体验
4. **可控性**: 自定义关键词补充官方审核不足

### Implementation Strategy

```javascript
// utils/content-filter.ts
async function filterContent(text, userId) {
  // 1. 快速本地关键词过滤（同步）
  if (this.containsBlockedWords(text)) {
    await this.logViolation(userId, text, 'KEYWORD_BLOCK');
    throw new ContentViolation('内容包含敏感词');
  }
  
  // 2. 微信内容安全API（异步，不阻塞返回）
  this.checkWithWechatAPI(text, userId).catch(err => {
    logger.error('Wechat content check failed', err);
  });
  
  return text; // 先返回给用户
}

// 微信API异步检查
async checkWithWechatAPI(text, userId) {
  const result = await wx.cloud.callFunction({
    name: 'msgSecCheck',
    data: { content: text }
  });
  
  if (result.errCode === 87014) {
    // 检测到违规内容
    await this.markUserContent(userId, 'BLOCKED');
    await this.notifyAdmin(userId, text);
  }
}
```

### Keyword Management

**敏感词库管理**：
- 存储在Redis Set数据结构：`blocked:keywords`
- 支持后台动态更新，无需重启服务
- 分级管理：严重违规（直接拒绝） vs 疑似违规（标记审核）

**误拦截率控制**：
- 自定义词库以白名单为主（营销常用词）
- 定期审查被拒内容，优化规则
- 目标：误拦截率<5%（SC-008）

### Alternatives Considered
- **第三方审核API（如阿里云）**: 增加成本，微信已提供免费API
- **纯关键词过滤**: 误拦截率高，用户体验差
- **人工审核**: 成本高，不适合实时场景

---

## 6. uni-app前端架构

### Decision
采用 **Vue 3 + Pinia + Composition API + 模块化API封装** 的架构模式。

### Rationale
1. **Vue生态成熟**: Composition API代码组织清晰，逻辑复用性强
2. **Pinia状态管理**: 轻量级、TypeScript友好，比Vuex更简洁
3. **组件复用**: 情绪风格选择器、场景卡片等可跨页面复用
4. **跨平台能力**: 一套代码可编译为微信小程序、H5、App
5. **开发体验**: VS Code/Cursor + 微信开发者工具，调试友好
6. **TypeScript支持**: 全栈类型安全，减少运行时错误

### Architecture Patterns

**1. Pinia状态管理**
```typescript
// stores/user.ts
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null as UserInfo | null,
    token: '',
    isLoggedIn: false
  }),
  
  getters: {
    nickname: (state) => state.userInfo?.nickname || '游客',
    membershipType: (state) => state.userInfo?.membershipType || 'FREE'
  },
  
  actions: {
    async login(code: string) {
      const res = await apiAuth.login(code);
      this.token = res.token;
      this.userInfo = res.user;
      this.isLoggedIn = true;
      uni.setStorageSync('token', res.token);
    },
    
    logout() {
      this.token = '';
      this.userInfo = null;
      this.isLoggedIn = false;
      uni.removeStorageSync('token');
    }
  }
});

// stores/quota.ts
export const useQuotaStore = defineStore('quota', {
  state: () => ({
    dailyLimit: 20,
    usedToday: 0,
    purchasedQuota: 0
  }),
  
  getters: {
    remaining: (state) => Math.max(state.dailyLimit - state.usedToday, 0) + state.purchasedQuota
  },
  
  actions: {
    async fetchQuota() {
      const res = await apiUser.getProfile();
      this.dailyLimit = res.quota.dailyLimit;
      this.usedToday = res.quota.usedToday;
      this.purchasedQuota = res.quota.purchasedQuota;
    }
  }
});
```

**2. 统一API封装**
```typescript
// utils/request.ts
import { useUserStore } from '@/stores/user';

class Request {
  private baseURL = process.env.VUE_APP_API_BASE_URL;
  
  async request<T>(options: UniApp.RequestOptions): Promise<T> {
    const userStore = useUserStore();
    
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}${options.url}`,
        method: options.method || 'GET',
        data: options.data,
        header: {
          'Authorization': `Bearer ${userStore.token}`,
          'Content-Type': 'application/json',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode === 401) {
            // Token过期，跳转登录
            userStore.logout();
            uni.navigateTo({ url: '/pages/login/login' });
            return reject(new Error('未授权'));
          }
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data as T);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  }
  
  get<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ url, method: 'GET', data });
  }
  
  post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ url, method: 'POST', data });
  }
}

export default new Request();

// api/content.ts
import request from '@/utils/request';

export const apiContent = {
  generate(params: GenerateParams) {
    return request.post<GenerateResponse>('/content/generate', params);
  },
  
  regenerate(recordId: string) {
    return request.post<GenerateResponse>('/content/regenerate', { recordId });
  },
  
  getHistory(page: number, pageSize: number) {
    return request.get<HistoryResponse>('/content/history', { page, pageSize });
  }
};
```

**3. Composition API页面示例**
```vue
<!-- pages/generate/generate.vue -->
<template>
  <view class="generate-page">
    <view class="scenario-info">
      <text class="title">{{ scenario?.name }}</text>
    </view>
    
    <view class="tone-selector">
      <ToneSelector v-model="selectedTone" />
    </view>
    
    <view class="input-form">
      <DynamicForm v-model="formData" :schema="scenario?.inputSchema" />
    </view>
    
    <button @click="handleGenerate" :disabled="isGenerating">
      {{ isGenerating ? '生成中...' : '生成文案' }}
    </button>
    
    <QuotaDisplay />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useQuotaStore } from '@/stores/quota';
import { apiContent, apiScenarios } from '@/api';

const route = useRoute();
const userStore = useUserStore();
const quotaStore = useQuotaStore();

const scenario = ref<Scenario | null>(null);
const selectedTone = ref('ENTHUSIASTIC');
const formData = ref({});
const isGenerating = ref(false);

onMounted(async () => {
  const slug = route.query.slug as string;
  scenario.value = await apiScenarios.getBySlug(slug);
  selectedTone.value = scenario.value.defaultToneStyle;
});

async function handleGenerate() {
  if (quotaStore.remaining <= 0) {
    uni.showModal({
      title: '配额不足',
      content: '今日配额已用完，是否升级会员？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/membership/membership' });
        }
      }
    });
    return;
  }
  
  isGenerating.value = true;
  try {
    const result = await apiContent.generate({
      scenarioSlug: scenario.value!.slug,
      toneStyle: selectedTone.value,
      userInput: formData.value
    });
    
    // 更新配额
    await quotaStore.fetchQuota();
    
    // 跳转结果页
    uni.navigateTo({
      url: `/pages/result/result?content=${encodeURIComponent(result.content)}`
    });
  } catch (error) {
    uni.showToast({
      title: error.message,
      icon: 'none'
    });
  } finally {
    isGenerating.value = false;
  }
}
</script>
```

**4. 分包策略（pages.json）**
```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": { "navigationBarTitleText": "灵眸ai文案" }
    },
    {
      "path": "pages/generate/generate",
      "style": { "navigationBarTitleText": "生成文案" }
    }
  ],
  "subPackages": [
    {
      "root": "pages-sub/membership",
      "pages": [
        {
          "path": "membership",
          "style": { "navigationBarTitleText": "会员中心" }
        }
      ]
    },
    {
      "root": "pages-sub/profile",
      "pages": [
        {
          "path": "history",
          "style": { "navigationBarTitleText": "历史记录" }
        },
        {
          "path": "feedback",
          "style": { "navigationBarTitleText": "意见反馈" }
        }
      ]
    }
  ]
}
```

### Performance Optimizations

1. **按需加载**: 使用分包加载，主包控制在1.5MB以内
2. **图片优化**: 
   - 使用WebP格式
   - 图片懒加载：`<image lazy-load="true" />`
   - CDN加速
3. **数据缓存**: 
   - Pinia持久化插件缓存用户信息
   - uni.setStorageSync缓存场景列表
4. **防抖节流**: 
   ```typescript
   import { debounce } from 'lodash-es';
   const handleSearch = debounce((keyword) => {
     // 搜索逻辑
   }, 300);
   ```
5. **虚拟列表**: 历史记录超过50条使用 `<recycle-list>` 或第三方虚拟列表组件

### uni-app特性利用

1. **条件编译**: 
   ```vue
   <!-- #ifdef MP-WEIXIN -->
   <button open-type="getUserInfo">微信授权</button>
   <!-- #endif -->
   
   <!-- #ifdef H5 -->
   <div class="h5-specific">H5专属内容</div>
   <!-- #endif -->
   ```

2. **跨平台API封装**:
   ```typescript
   // utils/platform.ts
   export const clipboard = {
     copy(text: string) {
       // #ifdef MP-WEIXIN
       uni.setClipboardData({ data: text });
       // #endif
       
       // #ifdef H5
       navigator.clipboard.writeText(text);
       // #endif
     }
   };
   ```

3. **uni-ui组件库**: 使用官方组件库提升开发效率
   - uni-data-picker（选择器）
   - uni-forms（表单）
   - uni-list（列表）

---

## 7. 监控与日志

### Decision
使用 **Winston日志 + 微信小程序分析 + 自定义监控指标**。

### Rationale
1. **问题定位**: 结构化日志快速定位问题
2. **性能监控**: 实时监控关键指标（响应时间、成功率）
3. **用户行为**: 微信小程序分析提供用户画像
4. **业务指标**: 自定义指标跟踪转化漏斗

### Key Metrics to Monitor

**技术指标**：
- AI生成响应时间（p50, p95, p99）
- API请求成功率
- 数据库查询时间
- Redis命中率
- 支付成功率

**业务指标**：
- DAU/MAU
- 免费→付费转化率
- 用户留存率（1日、7日、30日）
- 平均每用户生成次数
- 情绪风格使用分布

**告警策略**：
- API错误率>5%：立即告警
- AI响应时间>10秒：立即告警
- 支付失败率>5%：立即告警
- DeepSeek API可用性<95%：立即告警

---

## 8. 部署与运维

### Decision
使用 **Docker容器化 + 云服务器 + GitHub Actions CI/CD**。

### Rationale
1. **环境一致性**: Docker保证开发、测试、生产环境一致
2. **快速部署**: CI/CD自动化测试和部署
3. **可扩展性**: 容器化便于水平扩展
4. **成本控制**: 云服务器按需付费

### Deployment Architecture

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://...
      - REDIS_URL=redis://...
    depends_on:
      - mysql
      - redis
  
  mysql:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
  
  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data
  
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          ssh user@server "cd /app && git pull && docker-compose up -d --build"
```

---

## 研究总结

### 关键技术栈确认

| 组件 | 技术选型 | 理由 |
|------|---------|------|
| 前端 | uni-app 3.x (Vue 3 + TypeScript) | 跨平台能力强，开发效率高 |
| 状态管理 | Pinia | 轻量级，TypeScript友好 |
| 后端 | Node.js + TypeScript + Express | 生态成熟，开发效率高 |
| 数据库 | MySQL 8.0 + Prisma ORM | 事务支持强，类型安全 |
| 缓存 | Redis 6.0 | 高性能，分布式支持 |
| AI | DeepSeek Chat API (人性化提示词) | 成本低，中文优化好，可定制性强 |
| 支付 | 微信小程序支付 | 用户体验最佳 |
| 部署 | Docker + 云服务器 | 灵活可扩展 |

### 性能目标可行性验证

- ✅ AI生成<5秒：DeepSeek平均2-4秒，加上网络和处理1秒，满足要求
- ✅ 并发500用户：单实例Node.js可支持1000+并发，Redis更高
- ✅ API响应<200ms：本地数据库查询通常<50ms，Redis<1ms，满足要求
- ✅ 小程序包<2MB：分包策略可控制主包在1.5MB以内

### 成本预估验证

- 云服务器：2核4GB约200元/月 ✅
- DeepSeek API：10K用户×30次/月×0.001元 = 300元/月 ✅
- MySQL + Redis：包含在服务器内 ✅
- 微信认证：300元/年 ✅
- **总计约500-600元/月**，符合预期

### 风险与缓解措施

| 风险 | 缓解措施 |
|------|---------|
| DeepSeek API不稳定 | 实现重试机制，准备备用AI服务（如文心一言） |
| 内容审核误拦截 | 建立白名单，快速人工审核通道 |
| 支付回调丢失 | 订单状态轮询兜底，48小时自动查询 |
| 并发超预期 | Redis限流保护，自动扩容预案 |
| 小程序审核不通过 | 严格遵循微信规范，准备应急调整方案 |

---

**Phase 0 Complete** - 所有技术选型已完成研究和决策，可进入Phase 1设计阶段。

