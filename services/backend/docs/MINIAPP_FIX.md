# Mini App 503 错误修复指南

## 🔍 问题诊断

您遇到的 **HTTP ERROR 503** 是因为：
1. ❌ Cloudflare Tunnel Token 未配置
2. ❌ WEBAPP_URL 配置不正确
3. ❌ API 服务器可能未正常启动

---

## ✅ 解决方案

### 方案 1：配置 Cloudflare Tunnel（推荐）

#### 步骤 1：获取 Cloudflare Tunnel Token

1. 访问 [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. 进入 **Networks** → **Tunnels**
3. 创建或选择现有 Tunnel
4. 配置 Public Hostname：
   - **Public hostname**: `bot.yukinetwork.eu.org`
   - **Service**: `http://localhost:3000`
5. 复制 Tunnel Token

#### 步骤 2：更新 .env 配置

```bash
# 编辑 .env 文件
nano .env
```

添加/修改以下内容：

```env
# Telegram Mini App Dashboard URL
WEBAPP_URL=https://bot.yukinetwork.eu.org

# Cloudflare Tunnel Token
CF_TUNNEL_TOKEN=你的_tunnel_token_这里
```

#### 步骤 3：重启服务

```bash
# 重启 Docker 容器
docker-compose down
docker-compose up -d

# 查看日志
docker-compose logs -f
```

---

### 方案 2：使用本地 HTTPS（ngrok/localtunnel）

如果不想用 Cloudflare Tunnel，可以使用 ngrok：

```bash
# 安装 ngrok
# 访问 https://ngrok.com/ 注册并下载

# 启动隧道
ngrok http 3000
```

然后更新 `.env`：

```env
WEBAPP_URL=https://你的ngrok地址.ngrok-free.app
```

---

### 方案 3：临时测试（仅开发环境）

如果只是测试，可以暂时禁用 HTTPS 要求：

1. 修改 `src/bot/keyboards.ts`：

```typescript
// 找到这一行（约第 68 行）
if (webAppUrl.startsWith('https://')) {
    keyboard.webApp('💎 控制面板', webAppUrl);
} else {
    // 改为强制使用 webApp（仅测试！）
    keyboard.webApp('💎 控制面板', webAppUrl);
}
```

2. 更新 `.env`：

```env
WEBAPP_URL=http://192.168.5.100:3000
```

3. 重新构建并启动：

```bash
npm run build
docker-compose up -d --build
```

**⚠️ 注意**：Telegram 官方要求 Mini App 必须使用 HTTPS，此方法可能不稳定！

---

## 🧪 验证修复

### 1. 检查服务状态

```bash
# 查看容器状态
docker-compose ps

# 应该看到两个容器都在运行：
# - crypto-wallet-monitor (UP)
# - cloudflare-tunnel (UP)
```

### 2. 测试 API 端点

```bash
# 测试健康检查
curl http://localhost:3000/health

# 应该返回：
# {"status":"ok","version":"1.0.0"}
```

### 3. 测试外部访问

```bash
# 测试 Cloudflare Tunnel
curl https://bot.yukinetwork.eu.org/health
```

### 4. 在 Telegram 中测试

1. 打开 Telegram Bot
2. 发送 `/start`
3. 点击 **💎 控制面板** 按钮
4. 应该能正常打开 Mini App

---

## 🐛 常见问题

### Q1: Cloudflare Tunnel 一直显示 "Connecting"

**原因**：Token 配置错误或网络问题

**解决**：
```bash
# 查看 Cloudflare Tunnel 日志
docker-compose logs cloudflare-tunnel

# 检查是否有错误信息
```

### Q2: 点击按钮后显示 "请在 Telegram 中打开"

**原因**：前端鉴权失败

**解决**：
1. 确保在 Telegram 内部点击按钮（不是浏览器直接访问）
2. 检查 API 服务器日志：`docker-compose logs wallet-monitor-bot`

### Q3: 显示 401/403 错误

**原因**：Telegram initData 验证失败

**解决**：
1. 检查 Bot Token 是否正确
2. 确保 WEBAPP_URL 与实际访问地址一致
3. 重启服务：`docker-compose restart`

---

## 📞 需要帮助？

如果以上方法都无法解决，请提供以下信息：

```bash
# 收集诊断信息
echo "=== 容器状态 ==="
docker-compose ps

echo "=== Bot 日志 ==="
docker-compose logs --tail=50 wallet-monitor-bot

echo "=== Tunnel 日志 ==="
docker-compose logs --tail=50 cloudflare-tunnel

echo "=== 健康检查 ==="
curl http://localhost:3000/health
```

将输出发送给开发者进行诊断。
