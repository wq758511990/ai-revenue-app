# 🚀 超简单部署指南

## 一、后端一键部署（5分钟）

### 1. 配置生产环境变量

```bash
cd backend

# 复制生产环境配置模板
cp .env.production.example .env.production

# 编辑配置
nano .env.production
```

或者直接创建：

```bash
cd backend

# 创建 .env.production 文件
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# 数据库和 Redis（Docker 容器网络，不要修改）
DATABASE_URL=mysql://ai_user:ai_password_123@mysql:3306/ai_revenue_db
REDIS_HOST=redis
REDIS_PORT=6379

# JWT 配置（必须修改！）
JWT_SECRET=your_random_secret_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# 微信小程序配置（必填）
WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret

# AI 服务配置（必填）
DEEPSEEK_API_KEY=你的DeepSeek_API_Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# 配额配置
QUOTA_FREE_DAILY=10
QUOTA_MONTHLY_DAILY=100
QUOTA_YEARLY_DAILY=500

# 价格配置（单位：分）
PRICE_MONTHLY=2900
PRICE_YEARLY=19900

# 限流配置
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# 然后编辑填入真实值
nano .env.production
```

**必须修改的 4 项**：
1. `JWT_SECRET` - 生成随机密钥：`openssl rand -base64 32`
2. `WECHAT_APP_ID` - 你的小程序 AppID
3. `WECHAT_APP_SECRET` - 你的小程序 AppSecret
4. `DEEPSEEK_API_KEY` - 你的 DeepSeek API Key

### 2. 启动所有服务

```bash
# 使用生产配置启动所有容器
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 查看启动状态
docker-compose ps

# 查看日志
docker-compose logs -f api
```

**完成！** 后端服务已运行在 `http://localhost:3000`

验证：
```bash
# 健康检查
curl http://localhost:3000/health

# 应该返回：{"status":"ok","timestamp":"..."}
```

---

## 二、前端小程序配置（10分钟）

### 1. 获取小程序账号

1. 注册微信小程序：https://mp.weixin.qq.com/
2. 获取 AppID 和 AppSecret
3. 配置服务器域名白名单（后续部署到服务器后配置）

### 2. 修改前端配置

```bash
cd frontend

# 编辑 src/utils/request.ts
# 修改 BASE_URL 为你的服务器地址
# 开发环境：http://localhost:3000
# 生产环境：https://api.你的域名.com

# 编辑 src/manifest.json
# 填入你的 AppID
```

### 3. 编译小程序

```bash
# 安装依赖
npm install

# 编译小程序
npm run build:mp-weixin

# 编译后的文件在：dist/build/mp-weixin
```

### 4. 上传小程序

1. 打开微信开发者工具
2. 导入项目：选择 `frontend/dist/build/mp-weixin` 目录
3. 填入 AppID
4. 测试功能
5. 点击"上传"按钮

---

## 三、生产环境部署（可选）

### 如果要部署到云服务器：

#### 1. 准备服务器
- 购买云服务器（阿里云/腾讯云 2核4G）
- 购买域名并备案
- 安装 Docker 和 Docker Compose

#### 2. 上传代码

```bash
# 方式一：使用 rsync（推荐）
rsync -avz ./backend/ root@你的服务器IP:/var/www/ai-revenue-app/

# 方式二：使用 Git
ssh root@你的服务器IP
git clone 你的仓库地址
cd ai-revenue-app
```

#### 3. 修改配置

```bash
cd backend

# 修改 docker-compose.yml 中的 JWT_SECRET
# 生成随机密钥：
openssl rand -base64 32

# 配置 .env
nano .env
# 填入微信和 AI 服务配置
```

#### 4. 启动服务

```bash
docker-compose up -d
```

#### 5. 配置 Nginx + SSL

安装 Nginx：
```bash
apt install nginx certbot python3-certbot-nginx
```

创建配置 `/etc/nginx/sites-available/ai-revenue`:
```nginx
server {
    listen 80;
    server_name api.你的域名.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

启用并配置 SSL：
```bash
ln -s /etc/nginx/sites-available/ai-revenue /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
certbot --nginx -d api.你的域名.com
```

#### 6. 配置小程序域名白名单

登录微信公众平台，在"开发设置"中添加：
- request 合法域名：`https://api.你的域名.com`

---

## 常用命令

### Docker 管理

```bash
# 查看所有容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f api     # 只看后端日志
docker-compose logs -f mysql   # 只看数据库日志

# 重启服务
docker-compose restart api

# 停止所有服务
docker-compose down

# 停止并删除数据（谨慎使用）
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build
```

### 数据库管理

```bash
# 进入 MySQL 容器
docker-compose exec mysql mysql -u ai_user -pai_password_123 ai_revenue_db

# 备份数据库
docker-compose exec mysql mysqldump -u ai_user -pai_password_123 ai_revenue_db > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u ai_user -pai_password_123 ai_revenue_db < backup.sql
```

### 后端管理

```bash
# 查看后端日志
docker-compose logs -f api

# 进入后端容器
docker-compose exec api sh

# 重新运行数据库迁移
docker-compose exec api npx prisma migrate deploy

# 重新初始化数据
docker-compose exec api npx prisma db seed
```

---

## 故障排查

### 问题1：容器启动失败

```bash
# 查看日志
docker-compose logs

# 检查端口占用
netstat -tuln | grep 3000
netstat -tuln | grep 3306
netstat -tuln | grep 6379

# 如果端口被占用，修改 docker-compose.yml 中的端口映射
```

### 问题2：数据库连接失败

```bash
# 检查 MySQL 容器状态
docker-compose ps mysql

# 测试连接
docker-compose exec mysql mysql -u ai_user -pai_password_123 ai_revenue_db

# 查看 MySQL 日志
docker-compose logs mysql
```

### 问题3：小程序无法连接后端

**开发环境**：
- 在微信开发者工具中，点击右上角"详情" -> "本地设置"
- 勾选"不校验合法域名、web-view、TLS版本以及HTTPS证书"

**生产环境**：
- 确保后端已部署到服务器
- 确保使用 HTTPS
- 确保域名已添加到小程序白名单

---

## 快速开始检查清单

### 后端部署
- [ ] 安装 Docker 和 Docker Compose
- [ ] 创建 `.env` 配置文件
- [ ] 填写 JWT 密钥、微信配置、AI API Key
- [ ] 运行 `docker-compose up -d`
- [ ] 访问 `http://localhost:3000/health` 验证

### 前端小程序
- [ ] 注册微信小程序，获取 AppID
- [ ] 修改前端配置（API地址、AppID）
- [ ] 运行 `npm install && npm run build:mp-weixin`
- [ ] 使用微信开发者工具导入项目
- [ ] 测试功能正常
- [ ] 上传代码

### 生产环境（可选）
- [ ] 购买服务器和域名
- [ ] 域名备案
- [ ] 在服务器上运行 Docker Compose
- [ ] 配置 Nginx 和 SSL
- [ ] 配置小程序域名白名单
- [ ] 提交审核和发布

---

## 获取帮助

### 服务注册地址

1. **微信小程序**：https://mp.weixin.qq.com/
2. **DeepSeek AI**：https://platform.deepseek.com/
3. **阿里云**：https://www.aliyun.com/
4. **腾讯云**：https://cloud.tencent.com/

### 成本估算

**开发测试**（免费）
- Docker 本地运行：免费
- DeepSeek API：新用户送 5 元

**小规模运营**（约 ¥150/月）
- 云服务器 2核4G：¥100-150/月
- 域名：¥50-100/年
- SSL证书：免费（Let's Encrypt）
- DeepSeek API：按量付费，约 ¥50-100/月

---

**🎉 就是这么简单！**

本地开发只需：
1. 配置 `.env` 文件（2分钟）
2. 运行 `docker-compose up -d`（3分钟）
3. 开始使用！

有问题？查看日志：`docker-compose logs -f`

