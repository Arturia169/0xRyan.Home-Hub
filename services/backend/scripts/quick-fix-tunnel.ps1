# Cloudflare Tunnel 快速修复脚本 (PowerShell)
# 用于在 Windows 上生成配置，然后上传到服务器

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Cloudflare Tunnel 快速修复向导" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "请按照以下步骤操作：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 访问 https://one.dash.cloudflare.com/" -ForegroundColor Gray
Write-Host "2. 进入 Networks → Tunnels" -ForegroundColor Gray
Write-Host "3. 如果已有 'hbjk-tunnel'，点击进入；否则创建新的" -ForegroundColor Gray
Write-Host "4. 在 'Public Hostname' 标签页，添加：" -ForegroundColor Gray
Write-Host "   - Subdomain: bot" -ForegroundColor Gray
Write-Host "   - Domain: yukinetwork.eu.org" -ForegroundColor Gray
Write-Host "   - Type: HTTP" -ForegroundColor Gray
Write-Host "   - URL: localhost:3000" -ForegroundColor Gray
Write-Host "5. 复制 Tunnel Token" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "请粘贴 Tunnel Token"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "❌ Token 不能为空" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "正在生成配置..." -ForegroundColor Yellow

# 读取现有 .env
$envContent = @()
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
}

# 更新或添加配置
$tokenFound = $false
$webappFound = $false
$newContent = @()

foreach ($line in $envContent) {
    if ($line -match "^CF_TUNNEL_TOKEN=") {
        $newContent += "CF_TUNNEL_TOKEN=$token"
        $tokenFound = $true
    }
    elseif ($line -match "^WEBAPP_URL=") {
        $newContent += "WEBAPP_URL=https://bot.yukinetwork.eu.org"
        $webappFound = $true
    }
    else {
        $newContent += $line
    }
}

if (-not $tokenFound) {
    $newContent += "CF_TUNNEL_TOKEN=$token"
}

if (-not $webappFound) {
    $newContent += "WEBAPP_URL=https://bot.yukinetwork.eu.org"
}

# 保存到文件
$newContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ 已更新 .env 文件" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  下一步操作" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "方法 1：使用 Git 自动部署（推荐）" -ForegroundColor Yellow
Write-Host "  git add .env" -ForegroundColor Gray
Write-Host "  git commit -m 'fix: 更新 Cloudflare Tunnel Token'" -ForegroundColor Gray
Write-Host "  git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "方法 2：手动上传到服务器" -ForegroundColor Yellow
Write-Host "  1. 将 .env 文件上传到服务器 /root/hbjk/" -ForegroundColor Gray
Write-Host "  2. SSH 到服务器执行：" -ForegroundColor Gray
Write-Host "     cd /root/hbjk" -ForegroundColor Gray
Write-Host "     docker-compose down" -ForegroundColor Gray
Write-Host "     docker-compose up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  注意：.env 文件包含敏感信息，不要提交到公开仓库！" -ForegroundColor Yellow
Write-Host ""
