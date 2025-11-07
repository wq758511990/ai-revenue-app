#!/bin/bash

# ===================================
# 服务器端部署脚本
# ===================================

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始部署灵眸ai文案...${NC}"
echo ""

# 项目目录
PROJECT_DIR="/var/www/ai-revenue-app/ai-revenue-app"
BACKUP_DIR="/var/backups/ai-revenue-app"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 步骤 1: 备份数据库
echo -e "${YELLOW}📦 备份数据库...${NC}"
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
cd $PROJECT_DIR/backend
docker-compose exec -T mysql mysqldump -u ai_user -pai_password_123 ai_revenue_db > $BACKUP_FILE
echo -e "${GREEN}✓ 数据库备份完成: $BACKUP_FILE${NC}"
echo ""

# 步骤 2: 拉取最新代码
echo -e "${YELLOW}📥 拉取最新代码...${NC}"
cd $PROJECT_DIR
git pull origin main
echo -e "${GREEN}✓ 代码更新完成${NC}"
echo ""

# 步骤 3: 智能重新构建容器
echo -e "${YELLOW}🔨 重新构建 Docker 容器...${NC}"
cd $PROJECT_DIR/backend

# 启用 BuildKit 和 Compose Bake 加速构建
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export BUILDKIT_PROGRESS=plain

# 检查是否需要完全重新构建（Dockerfile 或 package.json 有变化）
if git diff HEAD@{1} HEAD --name-only | grep -qE "Dockerfile|package.*\.json|tsconfig\.json"; then
    echo -e "${YELLOW}检测到依赖或构建配置变化，使用 --no-cache 重新构建...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache --parallel api
else
    echo -e "${YELLOW}使用缓存快速构建...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel api
fi

echo -e "${GREEN}✓ 容器构建完成${NC}"
echo ""

# 步骤 4: 重启服务
echo -e "${YELLOW}🔄 重启服务...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo -e "${GREEN}✓ 服务重启完成${NC}"
echo ""

# 步骤 5: 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 15

# 步骤 6: 健康检查
echo -e "${YELLOW}🏥 执行健康检查...${NC}"
if curl -f http://localhost:3000/health; then
    echo -e "${GREEN}✓ 健康检查通过${NC}"
else
    echo -e "${RED}✗ 健康检查失败，正在回滚...${NC}"
    # 这里可以添加回滚逻辑
    exit 1
fi
echo ""

# 步骤 7: 显示服务状态
echo -e "${YELLOW}📊 服务状态:${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
echo ""

# 步骤 8: 清理旧备份（保留最近7天）
echo -e "${YELLOW}🧹 清理旧备份...${NC}"
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
echo -e "${GREEN}✓ 旧备份清理完成${NC}"
echo ""

echo -e "${GREEN}🎉 部署成功完成！${NC}"
echo ""
echo "查看日志: docker-compose logs -f api"
echo "停止服务: docker-compose down"
echo "查看状态: docker-compose ps"

