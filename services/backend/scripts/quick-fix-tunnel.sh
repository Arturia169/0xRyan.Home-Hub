#!/bin/bash

# Cloudflare Tunnel 快速修复脚本
# 用于在服务器上快速配置 Tunnel

echo "======================================"
echo "  Cloudflare Tunnel 快速修复"
echo "======================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 提示用户输入 Token
echo "请按照以下步骤操作："
echo ""
echo "1. 访问 https://one.dash.cloudflare.com/"
echo "2. 进入 Networks → Tunnels"
echo "3. 如果已有 'hbjk-tunnel'，点击进入；否则创建新的"
echo "4. 在 'Public Hostname' 标签页，添加："
echo "   - Subdomain: bot"
echo "   - Domain: yukinetwork.eu.org"
echo "   - Type: HTTP"
echo "   - URL: localhost:3000"
echo "5. 复制 Tunnel Token"
echo ""
read -p "请粘贴 Tunnel Token: " CF_TUNNEL_TOKEN

if [ -z "$CF_TUNNEL_TOKEN" ]; then
    echo "❌ Token 不能为空"
    exit 1
fi

echo ""
echo "正在更新配置..."

# 备份 .env
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ 已备份 .env 文件"
fi

# 更新或添加 Token
if grep -q "^CF_TUNNEL_TOKEN=" .env 2>/dev/null; then
    sed -i "s|^CF_TUNNEL_TOKEN=.*|CF_TUNNEL_TOKEN=$CF_TUNNEL_TOKEN|" .env
    echo "✅ 已更新 CF_TUNNEL_TOKEN"
else
    echo "CF_TUNNEL_TOKEN=$CF_TUNNEL_TOKEN" >> .env
    echo "✅ 已添加 CF_TUNNEL_TOKEN"
fi

# 确保 WEBAPP_URL 正确
if grep -q "^WEBAPP_URL=" .env; then
    sed -i "s|^WEBAPP_URL=.*|WEBAPP_URL=https://bot.yukinetwork.eu.org|" .env
else
    echo "WEBAPP_URL=https://bot.yukinetwork.eu.org" >> .env
fi
echo "✅ 已设置 WEBAPP_URL"

echo ""
echo "正在重启服务..."
docker-compose down
docker-compose up -d

echo ""
echo "等待服务启动..."
sleep 10

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
if curl -s https://bot.yukinetwork.eu.org/health | grep -q "ok"; then
    echo "✅ 外部访问正常"
else
    echo "⚠️  外部访问失败（可能需要等待 DNS 生效）"
fi

# 检查 Tunnel 状态
echo ""
echo "📝 Cloudflare Tunnel 日志（最后 20 行）:"
docker logs cloudflare-tunnel --tail 20

echo ""
echo "======================================"
echo "  完成！"
echo "======================================"
echo ""
echo "如果外部访问失败，请："
echo "1. 等待 1-2 分钟让 DNS 生效"
echo "2. 检查 Cloudflare Dashboard 中的 Public Hostname 配置"
echo "3. 运行: docker logs cloudflare-tunnel -f"
echo ""
