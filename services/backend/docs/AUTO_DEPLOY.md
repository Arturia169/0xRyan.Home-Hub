# 自动部署配置指南

## 🎯 功能说明

配置完成后，您只需要 `git push`，系统会自动：
1. ✅ 在 GitHub 上构建 Docker 镜像
2. ✅ 推送到 GitHub Container Registry
3. ✅ SSH 连接到您的 Debian 服务器
4. ✅ 拉取最新镜像并重启服务

**完全自动化，无需手动操作！**

---

## 📝 配置步骤

### 1️⃣ 生成 SSH 密钥对（如果还没有）

在您的**本地电脑**（Windows）上运行：

```powershell
ssh-keygen -t ed25519 -C "github-actions" -f github-deploy-key
```

这会生成两个文件：
- `github-deploy-key` - 私钥（保密！）
- `github-deploy-key.pub` - 公钥

### 2️⃣ 将公钥添加到服务器

将公钥内容复制到服务器的 `~/.ssh/authorized_keys`：

```bash
# 在您的 Debian 服务器上执行
cat >> ~/.ssh/authorized_keys << 'EOF'
# 这里粘贴 github-deploy-key.pub 的内容
EOF

# 设置正确的权限
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3️⃣ 在 GitHub 添加 Secrets

进入 GitHub 仓库：**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

添加以下 4 个 secrets：

| Secret 名称 | 值 | 说明 |
|------------|-------|------|
| `SERVER_HOST` | `您的服务器IP或域名` | 例如：`192.168.5.100` |
| `SERVER_USER` | `root` 或其他用户名 | SSH 登录用户 |
| `SSH_PRIVATE_KEY` | `github-deploy-key` 文件的**完整内容** | 包括 `-----BEGIN` 和 `-----END` |
| `DEPLOY_PATH` | `/root/crypto-wallet-monitor` | docker-compose.yml 所在目录 |

**可选**：
| Secret 名称 | 值 | 说明 |
|------------|-------|------|
| `SERVER_PORT` | `22` | SSH 端口（默认 22 可不填） |

---

## 🔐 SSH_PRIVATE_KEY 格式示例

复制 `github-deploy-key` 文件的**完整内容**，应该类似：

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
...（中间很多行）...
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END OPENSSH PRIVATE KEY-----
```

**注意**：
- ✅ 包含开头和结尾的 `-----BEGIN` 和 `-----END` 行
- ✅ 保持原始换行格式
- ❌ 不要添加额外的空格或修改内容

---

## ✅ 测试部署

配置完成后，有两种方式触发部署：

### 方法 1：自动触发
```bash
git push origin main
```
镜像构建成功后会自动部署到服务器

### 方法 2：手动触发
1. 进入 GitHub 仓库的 **Actions** 标签页
2. 选择 **Deploy to Server** workflow
3. 点击 **Run workflow** → **Run workflow**

---

## 📊 查看部署日志

1. 进入 GitHub 仓库的 **Actions** 标签页
2. 点击最新的 **Deploy to Server** workflow run
3. 查看详细日志，包括：
   - 拉取镜像进度
   - 容器重启状态
   - 最终运行状态

---

## 🔧 故障排查

### 问题 1：SSH 连接失败
**错误**：`Permission denied (publickey)`

**解决**：
1. 检查公钥是否正确添加到服务器 `~/.ssh/authorized_keys`
2. 检查 `SSH_PRIVATE_KEY` secret 是否包含完整内容
3. 确认服务器 SSH 服务正常运行：`systemctl status sshd`

### 问题 2：找不到 docker-compose 命令
**错误**：`docker-compose: command not found`

**解决**：
在 deploy.yml 中将 `docker-compose` 改为 `docker compose`（Docker Compose V2）

### 问题 3：权限不足
**错误**：`permission denied while trying to connect to the Docker daemon`

**解决**：
```bash
# 在服务器上执行
sudo usermod -aG docker $USER
# 重新登录或重启
```

---

## 🎉 完成！

配置完成后，您的工作流程变为：

```
修改代码 → git push
    ↓
GitHub 自动构建镜像
    ↓
自动推送到 GHCR
    ↓
自动 SSH 到服务器
    ↓
自动拉取并重启
    ↓
✅ 部署完成！
```

**完全自动化，喝杯咖啡等着就好！☕**
