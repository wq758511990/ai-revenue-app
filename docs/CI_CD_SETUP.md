# CI/CD 配置指南

实现自动化部署，每次推送代码到 GitHub 自动部署到服务器。

---

## 方案一：GitHub Actions（推荐）

### 优势
- ✅ 完全自动化
- ✅ 推送代码即部署
- ✅ 有部署日志
- ✅ 免费使用

---

## 准备工作

### 1. 在服务器上设置项目

**注意**：你的服务器是 OpenCloudOS 9.2（腾讯云），请先查看：[OpenCloudOS 服务器配置指南](./SERVER_SETUP_OPENCLOUDOS.md)

快速初始化：

```bash
# SSH 连接到你的服务器
ssh root@124.223.140.238

# 安装 Docker 和 Docker Compose（OpenCloudOS 使用 dnf）
sudo dnf install -y docker-ce docker-compose git
sudo systemctl start docker
sudo systemctl enable docker

# 创建项目目录
mkdir -p /var/www/ai-revenue-app
cd /var/www/ai-revenue-app

# 克隆你的代码仓库
git clone https://github.com/你的用户名/ai-revenue-app.git .

# 配置 .env 文件
cd backend
nano .env
# 填入微信、AI 配置等

# 首次启动
docker-compose up -d

# 验证服务
curl http://localhost:3000/health
```

### 2. 生成 SSH 密钥

```bash
# 在你的本地电脑执行
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_deploy

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/github_deploy.pub root@124.223.140.238

# 或手动复制
cat ~/.ssh/github_deploy.pub
# 然后在服务器上：
# echo "公钥内容" >> ~/.ssh/authorized_keys
```

### 3. 配置 GitHub Secrets

进入你的 GitHub 仓库：

1. 点击 `Settings` -> `Secrets and variables` -> `Actions`
2. 点击 `New repository secret`
3. 添加以下 secrets：

```
SERVER_HOST
值: 124.223.140.238

SERVER_USER
值: root

SSH_PRIVATE_KEY
值: (复制 ~/.ssh/github_deploy 文件的全部内容)
```

### 4. 推送工作流配置

```bash
# 将 .github/workflows/deploy.yml 推送到 GitHub
git add .github/workflows/deploy.yml
git commit -m "Add CI/CD workflow"
git push
```

---

## 使用方法

### 自动部署

```bash
# 本地修改代码
git add .
git commit -m "Update feature"
git push

# GitHub Actions 自动触发部署
# 1. 代码推送到 GitHub
# 2. 自动 SSH 到服务器
# 3. 拉取最新代码
# 4. 重新构建 Docker 容器
# 5. 重启服务
# 6. 健康检查
```

### 手动触发部署

1. 进入 GitHub 仓库
2. 点击 `Actions` 标签
3. 选择 `Deploy to Server`
4. 点击 `Run workflow`

### 查看部署日志

1. 进入 GitHub 仓库
2. 点击 `Actions` 标签
3. 点击最新的工作流运行
4. 查看每个步骤的日志

---

## 方案二：手动部署脚本

如果不想用 GitHub Actions，可以使用手动脚本。

### 在服务器上设置

```bash
# SSH 到服务器
ssh root@124.223.140.238

# 复制部署脚本
cd /var/www/ai-revenue-app
# 将 scripts/deploy.sh 上传到服务器

# 添加执行权限
chmod +x scripts/deploy.sh
```

### 每次部署时执行

```bash
# 本地推送代码
git push

# SSH 到服务器执行部署脚本
ssh root@124.223.140.238 "cd /var/www/ai-revenue-app && ./scripts/deploy.sh"
```

---

## 部署流程说明

### 自动化部署流程

```
1. 开发者推送代码到 GitHub
   ↓
2. GitHub Actions 触发
   ↓
3. SSH 连接到服务器 (124.223.140.238)
   ↓
4. 拉取最新代码 (git pull)
   ↓
5. 备份数据库
   ↓
6. 重新构建 Docker 镜像
   ↓
7. 重启容器 (docker-compose up -d)
   ↓
8. 健康检查 (curl /health)
   ↓
9. 部署成功 ✅
```

### 回滚机制

如果部署失败：

```bash
# SSH 到服务器
ssh root@124.223.140.238

# 查看备份
ls -lh /var/backups/ai-revenue-app/

# 恢复数据库
cd /var/www/ai-revenue-app/backend
docker-compose exec -T mysql mysql -u ai_user -pai_password_123 ai_revenue_db < /var/backups/ai-revenue-app/backup_YYYYMMDD_HHMMSS.sql

# 回滚代码
cd /var/www/ai-revenue-app
git reset --hard HEAD~1
docker-compose restart
```

---

## 监控和日志

### 查看部署日志

```bash
# 在 GitHub Actions 中查看
# 或 SSH 到服务器查看

ssh root@124.223.140.238
cd /var/www/ai-revenue-app/backend
docker-compose logs -f api
```

### 监控服务状态

```bash
# 查看容器状态
docker-compose ps

# 查看资源使用
docker stats

# 查看应用日志
docker-compose logs --tail=100 api
```

---

## 安全建议

### 1. 使用非 root 用户

```bash
# 创建部署专用用户
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# 修改 GitHub Secrets 中的 SERVER_USER 为 deploy
```

### 2. 配置防火墙

```bash
# 只开放必要端口
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 3. 定期备份

```bash
# 添加定时任务
crontab -e

# 每天凌晨 3 点备份
0 3 * * * cd /var/www/ai-revenue-app/backend && docker-compose exec -T mysql mysqldump -u ai_user -pai_password_123 ai_revenue_db > /var/backups/ai-revenue-app/daily_$(date +\%Y\%m\%d).sql
```

---

## 故障排查

### 问题1：GitHub Actions 无法连接服务器

```bash
# 检查 SSH 密钥
ssh -i ~/.ssh/github_deploy root@124.223.140.238

# 检查服务器防火墙
sudo ufw status

# 检查 SSH 配置
sudo nano /etc/ssh/sshd_config
# 确保：PubkeyAuthentication yes
```

### 问题2：部署后服务无法启动

```bash
# SSH 到服务器查看日志
ssh root@124.223.140.238
cd /var/www/ai-revenue-app/backend
docker-compose logs -f api

# 检查配置文件
cat .env

# 手动重启
docker-compose restart
```

### 问题3：健康检查失败

```bash
# 检查端口是否监听
netstat -tuln | grep 3000

# 手动测试健康接口
curl http://localhost:3000/health

# 检查容器内部
docker-compose exec api sh
curl http://localhost:3000/health
```

---

## 高级配置

### 多环境部署

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches:
      - develop

# .github/workflows/deploy-production.yml
on:
  push:
    branches:
      - main
```

### 通知集成

```yaml
# 添加到 deploy.yml
- name: 发送通知
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 总结

**推荐方案**：GitHub Actions + Docker Compose

**优势**：
- 🚀 推送即部署，完全自动化
- 📊 有完整的部署日志
- 🔄 支持回滚和重新部署
- 💰 免费使用

**下一步**：
1. 配置 GitHub Secrets
2. 推送代码测试部署
3. 设置定时备份
4. 配置监控告警

**需要帮助？**
- 查看 GitHub Actions 日志
- SSH 到服务器查看容器日志
- 检查健康接口：`curl http://124.223.140.238:3000/health`

