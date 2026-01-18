#!/bin/bash

# Mini App 诊断脚本

echo "======================================"
echo "  Mini App 诊断工具"
echo "======================================"
echo ""

# 1. 检查 .env 配置
echo "📋 1. 检查配置文件..."
if [ -f .env ]; then
    echo "✅ .env 文件存在"
    
    if grep -q "WEBAPP_URL=https://" .env; then
        WEBAPP_URL=$(grep "WEBAPP_URL=" .env | cut -d'=' -f2)
        echo "✅ WEBAPP_URL: $WEBAPP_URL"
    else
        echo "❌ WEBAPP_URL 未配置或不是 HTTPS"
    fi
    
    if grep -q "CF_TUNNEL_TOKEN=" .env && ! grep -q "CF_TUNNEL_TOKEN=your_" .env; then
        echo "✅ CF_TUNNEL_TOKEN 已配置"
    else
        echo "❌ CF_TUNNEL_TOKEN 未配置"
    fi
else
    echo "❌ .env 文件不存在"
fi
echo ""

# 2. 检查前端构建
echo "📦 2. 检查前端构建..."
if [ -d "dashboard/dist" ] && [ -f "dashboard/dist/index.html" ]; then
    echo "✅ 前端已构建"
else
    echo "❌ 前端未构建，请运行: cd dashboard && npm run build"
fi
echo ""

# 3. 检查 Docker 容器
echo "🐳 3. 检查 Docker 容器..."
if command -v docker &> /dev/null; then
    if docker ps | grep -q "crypto-wallet-monitor"; then
        echo "✅ Bot 容器正在运行"
    else
        echo "❌ Bot 容器未运行"
    fi
    
    if docker ps | grep -q "cloudflare-tunnel"; then
        echo "✅ Cloudflare Tunnel 容器正在运行"
    else
        echo "⚠️  Cloudflare Tunnel 容器未运行"
    fi
else
    echo "⚠️  Docker 未安装或未启动"
fi
echo ""

# 4. 测试本地 API
echo "🔌 4. 测试本地 API..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ API 服务器响应正常 (HTTP $HTTP_CODE)"
    else
        echo "❌ API 服务器无响应 (HTTP $HTTP_CODE)"
    fi
else
    echo "⚠️  curl 未安装，跳过测试"
fi
echo ""

# 5. 测试外部访问
echo "🌐 5. 测试外部访问..."
if [ ! -z "$WEBAPP_URL" ] && command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEBAPP_URL/health" 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ 外部访问正常 (HTTP $HTTP_CODE)"
    else
        echo "❌ 外部访问失败 (HTTP $HTTP_CODE)"
    fi
fi
echo ""

# 6. 建议
echo "======================================"
echo "  💡 修复建议"
echo "======================================"

if ! grep -q "CF_TUNNEL_TOKEN=" .env 2>/dev/null || grep -q "CF_TUNNEL_TOKEN=your_" .env 2>/dev/null; then
    echo "1. 配置 Cloudflare Tunnel Token"
    echo "   - 访问: https://one.dash.cloudflare.com/"
    echo "   - 创建 Tunnel 并获取 Token"
    echo "   - 添加到 .env: CF_TUNNEL_TOKEN=你的token"
    echo ""
fi

if ! grep -q "WEBAPP_URL=https://" .env 2>/dev/null; then
    echo "2. 配置 WEBAPP_URL 为 HTTPS 地址"
    echo "   - 编辑 .env: WEBAPP_URL=https://bot.yukinetwork.eu.org"
    echo ""
fi

if [ ! -d "dashboard/dist" ]; then
    echo "3. 构建前端"
    echo "   cd dashboard && npm install && npm run build"
    echo ""
fi

if ! docker ps | grep -q "crypto-wallet-monitor" 2>/dev/null; then
    echo "4. 启动服务"
    echo "   docker-compose up -d"
    echo ""
fi

echo "详细修复指南: docs/MINIAPP_FIX.md"
echo ""
