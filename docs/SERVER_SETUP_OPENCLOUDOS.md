# OpenCloudOS 服务器配置指南

针对 OpenCloudOS 9.2（腾讯云）的服务器初始化步骤。

---

## 一、初始化服务器（10分钟）

### 1. 更新系统

```bash
# SSH 连接
ssh root@124.223.140.238

# 更新系统
sudo dnf update -y
```

### 2. 安装 Docker

```bash
# 安装 Docker
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

### 3. 安装 Docker Compose

```bash
# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 4. 安装 Git

```bash
# 安装 Git
sudo dnf install -y git

# 配置 Git（可选）
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 5. 配置防火墙

```bash
# OpenCloudOS 使用 firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 开放必要端口
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp  # 如果需要直接访问 API

# 重载防火墙
sudo firewall-cmd --reload

# 查看状态
sudo firewall-cmd --list-all
```

---

## 二、部署项目

### 1. 创建项目目录

```bash
# 创建目录
sudo mkdir -p /var/www/ai-revenue-app
cd /var/www/ai-revenue-app

# 克隆代码（替换成你的仓库地址）
git clone https://github.com/你的用户名/ai-revenue-app.git .
```

### 2. 配置环境变量

```bash
cd /var/www/ai-revenue-app/backend

# 创建 .env 文件
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

JWT_SECRET=x0TKUZBtisDm9pG+/Up2c5N8L1xH7s/yPfN4Fo1x054=
JWT_EXPIRES_IN=7d

WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret

DEEPSEEK_API_KEY=你的DeepSeek_API_Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

QUOTA_FREE_DAILY=10
QUOTA_MONTHLY_DAILY=100
QUOTA_YEARLY_DAILY=500

PRICE_MONTHLY=2900
PRICE_YEARLY=19900

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# 编辑填入真实值
nano .env
```

### 3. 启动服务

```bash
# 启动所有容器
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f api

# 验证服务
curl http://localhost:3000/health
```

---

## 三、配置 Nginx（可选）

如果需要通过域名访问：

### 1. 安装 Nginx

```bash
# 安装 Nginx
sudo dnf install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. 配置反向代理

```bash
# 创建配置文件
sudo nano /etc/nginx/conf.d/ai-revenue-api.conf
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name api.你的域名.com;  # 或使用 IP: 124.223.140.238

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 3. 配置 SSL（如果有域名）

```bash
# 安装 Certbot
sudo dnf install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.你的域名.com

# 自动续期
sudo systemctl enable --now certbot-renew.timer
```

### 4. 重启 Nginx

```bash
# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx
```

---

## 四、SELinux 配置

OpenCloudOS 默认启用 SELinux，可能影响 Docker。

### 方案 1：禁用 SELinux（简单）

```bash
# 临时禁用
sudo setenforce 0

# 永久禁用
sudo sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config

# 重启生效
sudo reboot
```

### 方案 2：配置 SELinux（推荐）

```bash
# 允许 Docker 访问文件
sudo setsebool -P container_manage_cgroup on
sudo chcon -Rt svirt_sandbox_file_t /var/www/ai-revenue-app
```

---

## 五、设置自动备份

```bash
# 创建备份目录
sudo mkdir -p /var/backups/ai-revenue-app

# 创建备份脚本
sudo nano /root/backup-db.sh
```

添加以下内容：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ai-revenue-app"
DATE=$(date +%Y%m%d_%H%M%S)
cd /var/www/ai-revenue-app/backend

docker-compose exec -T mysql mysqldump -u ai_user -pai_password_123 ai_revenue_db > $BACKUP_DIR/backup_$DATE.sql

# 只保留最近 7 天的备份
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql"
```

```bash
# 添加执行权限
sudo chmod +x /root/backup-db.sh

# 添加定时任务
sudo crontab -e

# 添加：每天凌晨 3 点备份
0 3 * * * /root/backup-db.sh >> /var/log/backup.log 2>&1
```

---

## 六、安全加固

### 1. 修改 SSH 端口（可选）

```bash
# 编辑 SSH 配置
sudo nano /etc/ssh/sshd_config

# 修改端口
Port 2222

# 禁用 root 密码登录
PermitRootLogin prohibit-password
PasswordAuthentication no

# 重启 SSH
sudo systemctl restart sshd

# 开放新端口
sudo firewall-cmd --permanent --add-port=2222/tcp
sudo firewall-cmd --reload
```

### 2. 配置 fail2ban（防暴力破解）

```bash
# 安装 fail2ban
sudo dnf install -y epel-release
sudo dnf install -y fail2ban

# 启动服务
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# 配置
sudo nano /etc/fail2ban/jail.local
```

添加：

```ini
[sshd]
enabled = true
port = ssh
logpath = /var/log/secure
maxretry = 5
bantime = 3600
```

```bash
# 重启 fail2ban
sudo systemctl restart fail2ban
```

---

## 七、监控配置

### 查看系统资源

```bash
# 安装 htop
sudo dnf install -y htop

# 实时监控
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看 Docker 资源
docker stats
```

### 查看日志

```bash
# 应用日志
cd /var/www/ai-revenue-app/backend
docker-compose logs -f api

# 系统日志
sudo journalctl -f

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 八、常用命令

### Docker 管理

```bash
# 查看容器状态
docker-compose ps

# 重启服务
docker-compose restart api

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 清理未使用的镜像
docker system prune -a
```

### 服务管理

```bash
# 查看服务状态
sudo systemctl status nginx
sudo systemctl status docker
sudo systemctl status firewalld

# 重启服务
sudo systemctl restart nginx
sudo systemctl restart docker
```

---

## 九、故障排查

### 问题1：端口被占用

```bash
# 查看端口占用
sudo netstat -tuln | grep 3000
sudo ss -tuln | grep 3000

# 查找占用进程
sudo lsof -i :3000

# 杀死进程
sudo kill -9 PID
```

### 问题2：Docker 无法启动

```bash
# 查看 Docker 日志
sudo journalctl -u docker -f

# 重启 Docker
sudo systemctl restart docker

# 检查 SELinux
getenforce
sudo setenforce 0
```

### 问题3：防火墙阻止访问

```bash
# 检查防火墙规则
sudo firewall-cmd --list-all

# 临时关闭防火墙测试
sudo systemctl stop firewalld

# 添加规则
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## 十、OpenCloudOS 特定注意事项

### 1. 包管理器

```bash
# OpenCloudOS 使用 dnf（不是 apt）
sudo dnf install package_name
sudo dnf update
sudo dnf search package_name
```

### 2. 防火墙

```bash
# 使用 firewalld（不是 ufw）
sudo firewall-cmd --list-all
sudo firewall-cmd --add-service=http --permanent
```

### 3. SELinux

```bash
# OpenCloudOS 默认启用 SELinux
getenforce  # 查看状态
```

### 4. 系统服务

```bash
# 使用 systemctl
sudo systemctl start service_name
sudo systemctl enable service_name
sudo systemctl status service_name
```

---

## 完成检查清单

- [ ] Docker 已安装并运行
- [ ] Docker Compose 已安装
- [ ] Git 已安装
- [ ] 防火墙已配置
- [ ] 项目代码已克隆
- [ ] .env 文件已配置
- [ ] 服务已启动：`docker-compose ps`
- [ ] 健康检查通过：`curl http://localhost:3000/health`
- [ ] Nginx 已配置（如果需要）
- [ ] SSL 证书已配置（如果需要）
- [ ] 自动备份已设置
- [ ] CI/CD 已配置

---

## 快速启动脚本

如果需要重新初始化服务器，保存以下脚本：

```bash
#!/bin/bash
# 保存为 init-server.sh

# 更新系统
sudo dnf update -y

# 安装 Docker
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Git
sudo dnf install -y git

# 配置防火墙
sudo systemctl start firewalld
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

echo "✅ 服务器初始化完成！"
```

运行：

```bash
chmod +x init-server.sh
./init-server.sh
```

---

**针对 OpenCloudOS 的配置已完成！** 🎉

