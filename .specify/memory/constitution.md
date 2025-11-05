<!--
Sync Impact Report:
- Version Change: 初始化 → 1.0.0
- Added Principles:
  1. DRY Principle (Don't Repeat Yourself)
  2. No Magic Values
  3. SOLID Principles
- Added Sections:
  - Code Quality Standards
  - Development Practices
- Templates Status:
  ✅ plan-template.md - 无需更新
  ✅ spec-template.md - 无需更新  
  ✅ tasks-template.md - 无需更新
  ⚠️ 建议: 后续代码审查时验证原则遵守情况
- Follow-up TODOs:
  - 在下次代码审查时验证现有代码的合规性
  - 创建代码质量检查清单
-->

# AI智能文案助手小程序 Constitution

## Core Principles

### I. DRY Principle (Don't Repeat Yourself) - NON-NEGOTIABLE

**规则**: 所有出现两次以上的逻辑必须封装成可复用的函数、类或模块。

**具体要求**:
- 重复代码块（超过3行且逻辑相同）必须提取为独立函数
- 重复的业务逻辑必须封装在Service层
- 重复的UI组件必须提取为可复用组件
- 重复的常量、配置必须集中管理

**违规示例**: ❌
```typescript
// 在多个地方重复的验证逻辑
if (!userId) { return res.status(401).json({code: -1, message: '未授权'}); }
```

**正确示例**: ✅
```typescript
// 使用统一的响应工具
return ResponseUtil.unauthorized(res);
```

**理由**: 减少维护成本，确保一致性，降低出错概率

### II. No Magic Values - MANDATORY

**规则**: 代码中不允许出现任何魔法值（未命名的数字、字符串常量）。

**具体要求**:
- 所有数字常量必须定义为有意义的常量
- 所有字符串常量（错误消息、配置值）必须集中管理
- 使用枚举(Enum)或常量对象管理相关的一组值
- 常量命名必须清晰表达其用途

**违规示例**: ❌
```typescript
if (content.length < 5) { ... }  // 5是什么？
setTimeout(callback, 10 * 60 * 1000);  // 计算不直观
```

**正确示例**: ✅
```typescript
const MIN_CONTENT_LENGTH = 5;
if (content.length < MIN_CONTENT_LENGTH) { ... }

const DUPLICATE_CHECK_MINUTES = 10;
setTimeout(callback, DUPLICATE_CHECK_MINUTES * 60 * 1000);
```

**理由**: 提高代码可读性和可维护性，便于统一修改配置

### III. SOLID Principles - NON-NEGOTIABLE

**规则**: 所有代码必须遵守SOLID设计原则，不允许存在冗余代码。

**具体要求**:

**S - Single Responsibility**: 每个类/函数只负责一件事
- Controller只负责请求处理和响应
- Service只负责业务逻辑
- Utils只负责通用工具函数

**O - Open/Closed**: 对扩展开放，对修改关闭
- 使用接口和抽象类支持多态
- 新功能通过扩展而非修改实现

**L - Liskov Substitution**: 子类可替换父类
- 继承关系必须符合"is-a"语义
- 子类不能改变父类的行为契约

**I - Interface Segregation**: 接口隔离
- 客户端不应依赖它不需要的接口
- 大接口拆分为多个小接口

**D - Dependency Inversion**: 依赖倒置
- 高层模块不依赖低层模块，都依赖抽象
- 通过依赖注入实现解耦

**违规示例**: ❌
```typescript
// Controller中混杂业务逻辑
export const createOrder = async (req, res) => {
  // 直接在Controller中处理业务逻辑
  const user = await prisma.user.findUnique(...);
  const order = await prisma.order.create(...);
  await redis.set(...);
  ...
}
```

**正确示例**: ✅
```typescript
// Controller职责单一
export const createOrder = async (req, res) => {
  const result = await orderService.createOrder(req.body);
  ResponseUtil.success(res, result);
}

// Service处理业务逻辑
class OrderService {
  async createOrder(data) {
    // 业务逻辑封装
  }
}
```

**理由**: 提高代码可维护性、可测试性和可扩展性

## Code Quality Standards

### Refactoring Triggers

以下情况必须立即重构：
1. 相同代码出现2次以上
2. 函数长度超过50行
3. 函数参数超过5个
4. 圈复杂度超过10
5. 类的方法超过15个
6. 发现魔法值
7. 违反SOLID原则

### Code Review Requirements

每次代码审查必须检查：
- [ ] 是否有重复逻辑未封装
- [ ] 是否有魔法值
- [ ] 是否违反SOLID原则
- [ ] 是否有冗余代码
- [ ] 常量是否集中管理
- [ ] 响应格式是否统一

## Development Practices

### Constants Management

**后端**: 所有常量集中在 `src/constants/` 目录下：
- `feedback.constants.ts` - 反馈系统相关常量
- `quota.constants.ts` - 配额系统相关常量
- `response.constants.ts` - 响应格式相关常量
- 按功能模块组织常量文件

**前端**: 所有常量集中在 `src/constants/` 目录下：
- `api.constants.ts` - API相关常量
- `ui.constants.ts` - UI相关常量
- 按功能模块组织常量文件

### Utility Functions

**后端**: 统一工具类在 `src/utils/` 目录：
- `response.ts` - 统一响应处理工具（ResponseUtil）
- `validation.ts` - 通用验证工具
- 工具类必须使用static方法或导出函数

**前端**: 统一工具在 `src/utils/` 目录：
- `request.ts` - 统一请求封装
- `format.ts` - 格式化工具
- 工具函数必须纯函数，无副作用

### Service Layer Architecture

**必须遵守的分层架构**:
```
Controller → Service → Repository/Prisma
   ↓           ↓            ↓
响应处理   业务逻辑      数据访问
```

- Controller不能直接访问数据库
- Service不能直接处理HTTP响应
- 跨层调用必须通过依赖注入

## Governance

### Amendment Process

宪章修改流程：
1. 提出修改提案（说明原因和影响）
2. 团队讨论和评审
3. 更新宪章文档
4. 递增版本号（遵循语义化版本）
5. 同步更新相关模板和文档
6. 通知所有开发人员

### Version Policy

版本号遵循语义化版本规范（Semantic Versioning）:
- **MAJOR**: 原则移除、重大架构变更
- **MINOR**: 新增原则、新增约束
- **PATCH**: 文字修正、澄清说明

### Compliance Review

合规性审查要求：
- 每个PR必须验证是否符合宪章原则
- 定期代码审计（每月）检查历史代码合规性
- 违规代码必须立即重构
- 持续改进：定期回顾并优化原则

### Enforcement

违规处理：
1. **轻微违规**（1-2处魔法值）：要求PR中修复
2. **中度违规**（重复代码未封装）：PR被拒，必须重构后重新提交
3. **严重违规**（违反SOLID原则）：代码回滚，重新设计

**Version**: 1.0.0 | **Ratified**: 2025-11-05 | **Last Amended**: 2025-11-05
