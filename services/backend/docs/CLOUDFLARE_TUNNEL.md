# Cloudflare Tunnel 配置说明

## 📖 什么是 Cloudflare Tunnel？

Cloudflare Tunnel（原名 Argo Tunnel）可以让你的本地服务通过 Cloudflare 网络安全地暴露到互联网，无需开放防火墙端口。

**优势**：
- 🔒 **安全**：不需要开放公网端口
- 🌐 **HTTPS**：自动提供 SSL/TLS 加密
- 🚀 **CDN**：通过 Cloudflare 全球网络加速
- 🛡️ **DDoS 防护**：自动防御攻击

---

## 🏗️ 架构说明

```
Telegram Mini App
       ↓
https://bot.yukinetwork.eu.org (Cloudflare CDN)
       ↓
Cloudflare Tunnel (cloudflared 容器)
       ↓
http://localhost:3000 (API 服务器)
```

---

## 🔧 配置方式

本项目使用**配置文件方式**启动 Tunnel，配置文件位于 `cloudflared/` 目录：

### 1. config.yml
```yaml
tunnel: <tunnel-id>
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: bot.yukinetwork.eu.org
    service: http://localhost:3000
  - service: http_status:404
```

### 2. credentials.json
```json
{
  "AccountTag": "<account-id>",
  "TunnelSecret": "<tunnel-secret>",
  "TunnelID": "<tunnel-id>"
}
```

---

## 🚀 自动部署流程

GitHub Actions 会自动完成以下步骤：

### 步骤 1：创建 Tunnel
```bash
# 通过 Cloudflare API 创建 Tunnel
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/tunnels" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" \
  --data '{"name":"hbjk-tunnel","tunnel_secret":"<random-secret>"}'
```

### 步骤 2：配置 DNS
```bash
# 创建 CNAME 记录：bot.yukinetwork.eu.org -> <tunnel-id>.cfargotunnel.com
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  --data '{"type":"CNAME","name":"bot","content":"<tunnel-id>.cfargotunnel.com","proxied":true}'
```

### 步骤 3：生成配置文件
```bash
# 在服务器上创建 config.yml 和 credentials.json
mkdir -p cloudflared
cat > cloudflared/config.yml <<EOF
tunnel: <tunnel-id>
credentials-file: /etc/cloudflared/credentials.json
ingress:
  - hostname: bot.yukinetwork.eu.org
    service: http://localhost:3000
  - service: http_status:404
EOF
```

### 步骤 4：启动容器
```bash
docker-compose up -d cloudflare-tunnel
```

---

## 🔍 验证配置

### 1. 检查 Tunnel 状态
```bash
# 查看容器日志
docker logs cloudflare-tunnel

# 应该看到：
# ✅ Registered tunnel connection
# ✅ Connection established
```

### 2. 测试连接
```bash
# 测试外部访问
curl https://bot.yukinetwork.eu.org/health

# 应该返回：
# {"status":"ok","version":"1.0.0"}
```

### 3. 在 Cloudflare Dashboard 查看
访问：https://one.dash.cloudflare.com/
- 进入 **Networks** → **Tunnels**
- 应该看到 `hbjk-tunnel` 状态为 **HEALTHY**

---

## 🐛 常见问题

### Q1: 日志显示 "No ingress rules were defined"

**原因**：配置文件未正确加载

**解决**：
```bash
# 检查配置文件是否存在
ls -la cloudflared/

# 应该看到：
# config.yml
# credentials.json

# 检查文件内容
cat cloudflared/config.yml

# 重启容器
docker-compose restart cloudflare-tunnel
```

### Q2: 显示 "Connection terminated"

**原因**：凭据无效或 Tunnel 已删除

**解决**：
1. 访问 Cloudflare Dashboard 确认 Tunnel 存在
2. 重新运行部署脚本生成新的凭据
3. 或手动触发 GitHub Actions 重新部署

### Q3: 503 错误但 Tunnel 正常

**原因**：本地服务未启动或端口错误

**解决**：
```bash
# 检查 API 服务器是否运行
curl http://localhost:3000/health

# 检查容器状态
docker-compose ps

# 查看 Bot 容器日志
docker logs crypto-wallet-monitor
```

---

## 🔐 安全建议

1. **保护凭据文件**
   ```bash
   chmod 600 cloudflared/credentials.json
   ```

2. **不要提交到 Git**
   - `cloudflared/credentials.json` 已在 `.gitignore` 中
   - 只提交 `.example` 示例文件

3. **定期轮换密钥**
   - 定期在 Cloudflare Dashboard 重新生成 Tunnel
   - 更新服务器上的配置文件

4. **限制访问**
   - 在 Cloudflare 中配置 Access 策略
   - 只允许特定 IP 或用户访问

---

## 📚 参考资料

- [Cloudflare Tunnel 官方文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [配置文件参考](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/local-management/configuration-file/)
- [Ingress Rules 配置](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/local-management/ingress/)

---

## 💡 手动配置（可选）

如果自动部署失败，可以手动配置：

### 1. 在 Cloudflare Dashboard 创建 Tunnel
1. 访问 https://one.dash.cloudflare.com/
2. 进入 **Networks** → **Tunnels** → **Create a tunnel**
3. 选择 **Cloudflared**
4. 输入名称：`hbjk-tunnel`
5. 复制 Token

### 2. 配置 Public Hostname
1. 在 Tunnel 详情页，点击 **Public Hostname** → **Add a public hostname**
2. 配置：
   - **Subdomain**: `bot`
   - **Domain**: `yukinetwork.eu.org`
   - **Service**: `http://localhost:3000`
3. 保存

### 3. 更新服务器配置
```bash
# SSH 到服务器
cd /root/hbjk

# 编辑 .env
nano .env

# 添加 Token
CF_TUNNEL_TOKEN=你复制的token

# 重启服务
docker-compose restart cloudflare-tunnel
```

完成！
