# Mini App 诊断脚本 (PowerShell)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Mini App 诊断工具" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 .env 配置
Write-Host "📋 1. 检查配置文件..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env 文件存在" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "WEBAPP_URL=https://") {
        $webappUrl = ($envContent | Select-String "WEBAPP_URL=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
        Write-Host "✅ WEBAPP_URL: $webappUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ WEBAPP_URL 未配置或不是 HTTPS" -ForegroundColor Red
    }
    
    if ($envContent -match "CF_TUNNEL_TOKEN=.+" -and $envContent -notmatch "CF_TUNNEL_TOKEN=your_") {
        Write-Host "✅ CF_TUNNEL_TOKEN 已配置" -ForegroundColor Green
    } else {
        Write-Host "❌ CF_TUNNEL_TOKEN 未配置" -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env 文件不存在" -ForegroundColor Red
}
Write-Host ""

# 2. 检查前端构建
Write-Host "📦 2. 检查前端构建..." -ForegroundColor Yellow
if ((Test-Path "dashboard\dist") -and (Test-Path "dashboard\dist\index.html")) {
    Write-Host "✅ 前端已构建" -ForegroundColor Green
} else {
    Write-Host "❌ 前端未构建，请运行: cd dashboard; npm run build" -ForegroundColor Red
}
Write-Host ""

# 3. 检查 Docker 容器
Write-Host "🐳 3. 检查 Docker 容器..." -ForegroundColor Yellow
try {
    $containers = docker ps 2>$null
    
    if ($containers -match "crypto-wallet-monitor") {
        Write-Host "✅ Bot 容器正在运行" -ForegroundColor Green
    } else {
        Write-Host "❌ Bot 容器未运行" -ForegroundColor Red
    }
    
    if ($containers -match "cloudflare-tunnel") {
        Write-Host "✅ Cloudflare Tunnel 容器正在运行" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Cloudflare Tunnel 容器未运行" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Docker 未安装或未启动" -ForegroundColor Yellow
}
Write-Host ""

# 4. 测试本地 API
Write-Host "🔌 4. 测试本地 API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API 服务器响应正常 (HTTP $($response.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ API 服务器无响应" -ForegroundColor Red
}
Write-Host ""

# 5. 测试外部访问
Write-Host "🌐 5. 测试外部访问..." -ForegroundColor Yellow
if ($webappUrl) {
    try {
        $response = Invoke-WebRequest -Uri "$webappUrl/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ 外部访问正常 (HTTP $($response.StatusCode))" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ 外部访问失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# 6. 建议
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  💡 修复建议" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$needsFix = $false

if (-not (Test-Path ".env") -or (Get-Content ".env" -Raw) -notmatch "CF_TUNNEL_TOKEN=.+" -or (Get-Content ".env" -Raw) -match "CF_TUNNEL_TOKEN=your_") {
    Write-Host "1. 配置 Cloudflare Tunnel Token" -ForegroundColor Yellow
    Write-Host "   - 访问: https://one.dash.cloudflare.com/" -ForegroundColor Gray
    Write-Host "   - 创建 Tunnel 并获取 Token" -ForegroundColor Gray
    Write-Host "   - 添加到 .env: CF_TUNNEL_TOKEN=你的token" -ForegroundColor Gray
    Write-Host ""
    $needsFix = $true
}

if (-not (Test-Path ".env") -or (Get-Content ".env" -Raw) -notmatch "WEBAPP_URL=https://") {
    Write-Host "2. 配置 WEBAPP_URL 为 HTTPS 地址" -ForegroundColor Yellow
    Write-Host "   - 编辑 .env: WEBAPP_URL=https://bot.yukinetwork.eu.org" -ForegroundColor Gray
    Write-Host ""
    $needsFix = $true
}

if (-not (Test-Path "dashboard\dist")) {
    Write-Host "3. 构建前端" -ForegroundColor Yellow
    Write-Host "   cd dashboard; npm install; npm run build" -ForegroundColor Gray
    Write-Host ""
    $needsFix = $true
}

try {
    $containers = docker ps 2>$null
    if ($containers -notmatch "crypto-wallet-monitor") {
        Write-Host "4. 启动服务" -ForegroundColor Yellow
        Write-Host "   docker-compose up -d" -ForegroundColor Gray
        Write-Host ""
        $needsFix = $true
    }
} catch {}

if (-not $needsFix) {
    Write-Host "✅ 所有检查通过！" -ForegroundColor Green
    Write-Host ""
}

Write-Host "详细修复指南: docs\MINIAPP_FIX.md" -ForegroundColor Cyan
Write-Host ""
