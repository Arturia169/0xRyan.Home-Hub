# 手动配置 Cloudflare Tunnel（最可靠的方法）

## 🎯 为什么需要手动配置？

虽然我们尝试通过 API 自动配置，但 Cloudflare Tunnel 的 Ingress Rules 通过 Dashboard 配置更稳定可靠。

---

## 📋 步骤 1：在 Cloudflare Dashboard 创建 Tunnel

### 1.1 访问 Cloudflare Zero Trust
访问：https://one.dash.cloudflare.com/

### 1.2 进入 Tunnels 页面
- 左侧菜单：**Networks** → **Tunnels**
- 点击 **Create a tunnel**

### 1.3 选择 Tunnel 类型
- 选择 **Cloudflared**
- 点击 **Next**

### 1.4 命名 Tunnel
- **Tunnel name**: `hbjk-tunnel`
- 点击 **Save tunnel**

### 1.5 复制 Token
- 页面会显示安装命令，其中包含一个很长的 Token
- 复制这个 Token（类似：`eyJhIjoiNDY5MDZmNDkxMmZiMGJmM2U5YWQzMzUxZGRjNTgzOTgiLCJ0IjoiM2ZhOThhMGEtN2U2Yi00MGMwLTk4NDYtMDkzY2IyZjE0NzU0IiwicyI6Ik5qWTBNVEUyTmpBdE1qQXhOaTAwWkRZMUxUazRNR1V0TkRVMk1qQTFNVGd4TmpJMCJ9`）

---

## 📋 步骤 2：配置 Public Hostname（重要！）

### 2.1 在 Tunnel 详情页
- 点击 **Public Hostname** 标签
- 点击 **Add a public hostname**

### 2.2 配置转发规则
填写以下信息：

| 字段 | 值 |
|------|-----|
| **Subdomain** | `bot` |
| **Domain** | `yukinetwork.eu.org` |
| **Path** | 留空 |
| **Type** | `HTTP` |
| **URL** | `localhost:3000` |

### 2.3 保存
- 点击 **Save hostname**
- 等待几秒钟让配置生效

---

## 📋 步骤 3：更新服务器配置

### 3.1 SSH 到服务器
```bash
ssh root@你的服务器IP
cd /root/hbjk
```

### 3.2 编辑 .env 文件
```bash
nano .env
```

### 3.3 添加/更新 Token
找到或添加这一行：
```env
CF_TUNNEL_TOKEN=你在步骤1.5复制的token
```

确保 WEBAPP_URL 正确：
```env
WEBAPP_URL=https://bot.yukinetwork.eu.org
```

保存文件（Ctrl+O，Enter，Ctrl+X）

### 3.4 重启服务
```bash
docker-compose down
docker-compose up -d
```

### 3.5 查看日志
```bash
# 查看 Tunnel 日志
docker logs cloudflare-tunnel -f

# 应该看到：
# ✅ Registered tunnel connection
# ✅ 不再有 "No ingress rules" 错误
```

---

## 📋 步骤 4：验证配置

### 4.1 测试本地 API
```bash
curl http://localhost:3000/health
# 应该返回：{"status":"ok","version":"1.0.0"}
```

### 4.2 测试外部访问
```bash
curl https://bot.yukinetwork.eu.org/health
# 应该返回：{"status":"ok","version":"1.0.0"}
```

### 4.3 在 Telegram 中测试
1. 打开 Telegram Bot
2. 发送 `/start`
3. 点击 **💎 控制面板**
4. 应该能正常打开 Mini App

---

## 🎉 完成！

如果以上步骤都成功，你的 Mini App 现在应该可以正常访问了。

---

## 🐛 故障排查

### 问题 1：Tunnel 日志显示 "connection terminated"

**原因**：Token 无效或 Tunnel 被删除

**解决**：
1. 在 Cloudflare Dashboard 重新生成 Token
2. 更新 `.env` 文件
3. 重启容器：`docker-compose restart cloudflare-tunnel`

### 问题 2：外部访问返回 502

**原因**：本地服务未启动

**解决**：
```bash
# 检查 Bot 容器状态
docker ps | grep crypto-wallet-monitor

# 查看 Bot 日志
docker logs crypto-wallet-monitor

# 重启 Bot
docker-compose restart wallet-monitor-bot
```

### 问题 3：DNS 解析失败

**原因**：DNS 记录未正确配置

**解决**：
1. 访问 Cloudflare Dashboard
2. 进入 **DNS** → **Records**
3. 确认存在 CNAME 记录：
   - **Name**: `bot`
   - **Target**: `<tunnel-id>.cfargotunnel.com`
   - **Proxy status**: Proxied（橙色云朵）

---

## 📸 配置截图参考

### Tunnel 创建页面
![Create Tunnel](https://developers.cloudflare.com/assets/create-tunnel_hu4de928e26f2e5e0e0e0e0e0e0e0e0e0e_123456_1200x0_resize_q75_box.jpg)

### Public Hostname 配置
```
┌─────────────────────────────────────────┐
│ Subdomain: bot                          │
│ Domain: yukinetwork.eu.org              │
│ Path: [留空]                            │
│                                         │
│ Type: HTTP                              │
│ URL: localhost:3000                     │
└─────────────────────────────────────────┘
```

---

## 💡 提示

- Token 只显示一次，请妥善保存
- 如果忘记 Token，可以在 Tunnel 详情页重新生成
- 配置更改通常在 30 秒内生效
- 使用 `docker logs -f cloudflare-tunnel` 实时查看连接状态

---

## 🔗 相关链接

- [Cloudflare Tunnel 官方文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
- [故障排查指南](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/local-management/troubleshooting/)
