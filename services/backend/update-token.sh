#!/bin/bash

# 快速更新 Cloudflare Tunnel Token 脚本

echo "======================================"
echo "  更新 Cloudflare Tunnel Token"
echo "======================================"
echo ""

# 新的 Token
NEW_TOKEN="eyJhIjoiNDY5MDZmNDkxMmZiMGJmM2U5YWQzMzUxZGRjNTgzOTgiLCJ0IjoiYjY3NzQxNjctYzZjMC00YmI2LTliMWItNDlhMTU4YWNmYjU4IiwicyI6IlptWTNZV1E1TW1VdFpEQTFZaTAwTldObUxUbGlNR010TWpsallqZzBaalEwTlRRMiJ9"

echo "正在更新 .env 文件..."

# 检查是否在正确目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误：请在项目根目录 (/root/hbjk) 运行此脚本"
    exit 1
fi

# 备份 .env
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ 已备份 .env 文件"
fi

# 更新 Token
if grep -q "^CF_TUNNEL_TOKEN=" .env 2>/dev/null; then
    sed -i "s|^CF_TUNNEL_TOKEN=.*|CF_TUNNEL_TOKEN=$NEW_TOKEN|" .env
    echo "✅ 已更新 CF_TUNNEL_TOKEN"
else
    echo "CF_TUNNEL_TOKEN=$NEW_TOKEN" >> .env
    echo "✅ 已添加 CF_TUNNEL_TOKEN"
fi

# 更新 WEBAPP_URL
if grep -q "^WEBAPP_URL=" .env; then
    sed -i "s|^WEBAPP_URL=.*|WEBAPP_URL=https://app.yukinetwork.eu.org|" .env
else
    echo "WEBAPP_URL=https://app.yukinetwork.eu.org" >> .env
fi
echo "✅ 已更新 WEBAPP_URL"

echo ""
echo "正在重启服务..."
docker-compose down
docker-compose up -d

echo ""
echo "等待服务启动..."
sleep 15

echo ""
echo "======================================"
echo "  测试结果"
echo "======================================"

# 测试本地 API
echo ""
echo "🔍 测试本地 API..."
if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo "✅ 本地 API 正常"
else
    echo "❌ 本地 API 无响应"
fi

# 测试外部访问
echo ""
echo "🌐 测试外部访问..."
if curl -s https://app.yukinetwork.eu.org/health | grep -q "ok"; then
    echo "✅ 外部访问正常"
else
    echo "⚠️  外部访问失败（可能需要等待 DNS 生效）"
fi

# 检查 Tunnel 状态
echo ""
echo "📝 Cloudflare Tunnel 日志（最后 10 行）:"
docker logs cloudflare-tunnel --tail 10

echo ""
echo "📊 容器状态:"
docker-compose ps

echo ""
echo "======================================"
echo "  完成！"
echo "======================================"
echo ""
echo "如果 Tunnel 状态仍显示停用，请等待 1-2 分钟"
echo "然后刷新 Cloudflare Dashboard 页面"
echo ""