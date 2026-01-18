# 🤖 虚拟钱包监控机器人

基于 Telegram Bot API 的虚拟钱包监控机器人，支持实时监控 **Arbitrum One** 和 **Tron** 链上的资产变化。

[![Auto Deploy](https://img.shields.io/badge/deploy-automatic-success?logo=github)](https://github.com/Arturia169/crypto-wallet-monitor/actions)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-blue?logo=docker)](https://github.com/Arturia169/crypto-wallet-monitor/pkgs/container/crypto-wallet-monitor)

> 🚀 **支持自动部署**：`git push` 后自动构建镜像并部署到服务器！详见 [自动部署配置](docs/AUTO_DEPLOY.md)

## ✨ 功能特性

### 核心功能
- 🏦 **钱包监控** - 实时监控指定钱包地址的余额变化
- 💸 **交易通知** - 检测到转入/转出交易时发送通知
- 📊 **余额查询** - 随时查询各钱包的代币余额
- 💰 **价格追踪** - 获取代币实时价格（USD 计价）
- ⚠️ **阈值告警** - 余额低于/高于设定值时触发告警
- 📈 **资产统计** - 汇总所有钱包的总资产价值

### 支持的区块链
| 链 | 原生代币 | ERC20/TRC20 代币 |
|------|----------|------------------|
| 🔵 Arbitrum One | ETH | USDC, USDT, ARB |
| 🔴 Tron | TRX | USDC, USDT |

## 🚀 快速开始

### 前置要求
- Docker 和 Docker Compose
- Telegram Bot Token（从 [@BotFather](https://t.me/BotFather) 获取）
- TronGrid API Key（可选，从 [TronGrid](https://www.trongrid.io/) 获取）

### 部署步骤

1. **克隆或上传项目到服务器**
```bash
# 创建项目目录
mkdir -p /opt/wallet-monitor
cd /opt/wallet-monitor
# 上传项目文件...
```

2. **创建环境变量配置文件**
```bash
cp .env.example .env
nano .env
```

3. **编辑 `.env` 文件**
```env
# 必填：Telegram Bot Token
TELEGRAM_BOT_TOKEN=your_bot_token_here

# 可选：限制允许使用的用户 ID（留空允许所有人）
ALLOWED_USER_IDS=123456789

# 可选但推荐：TronGrid API Key
TRON_API_KEY=your_trongrid_api_key

# 可选：自定义 Arbitrum RPC
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# 监控间隔（秒）
MONITOR_INTERVAL=30
```

4. **启动服务**
```bash
# 构建并启动（后台运行）
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 📱 Bot 命令

| 命令 | 描述 | 示例 |
|------|------|------|
| `/start` | 开始使用 / 主菜单 | `/start` |
| `/add` | 添加监控钱包 | `/add arb 0x1234... 我的钱包` |
| `/list` | 查看所有钱包 | `/list` |
| `/remove` | 移除监控钱包 | `/remove 0x1234...` |
| `/balance` | 查询钱包余额 | `/balance` 或 `/balance 0x1234...` |
| `/price` | 查询代币价格 | `/price` 或 `/price eth` |
| `/alert` | 设置余额告警 | `/alert 0x1234... ETH 0.1` |
| `/stats` | 资产统计汇总 | `/stats` |
| `/help` | 帮助信息 | `/help` |

### 添加钱包示例
```
# 添加 Arbitrum 钱包
/add arb 0x742d35Cc6634C0532925a3b844Bc9e7595f3 MyWallet

# 添加 Tron 钱包
/add tron TJYeasdfghjklzxcvbnmqwertyuiop 热钱包

# 自动检测链类型
/add 0x742d35Cc6634C0532925a3b844Bc9e7595f3
/add TJYeasdfghjklzxcvbnmqwertyuiop
```

## 🔧 配置说明

### 环境变量

| 变量名 | 必填 | 描述 | 默认值 |
|--------|------|------|--------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram Bot Token | - |
| `ALLOWED_USER_IDS` | ❌ | 允许的用户 ID（逗号分隔） | 允许所有 |
| `ARBITRUM_RPC_URL` | ❌ | Arbitrum RPC URL | 公共 RPC |
| `TRON_API_KEY` | ❌ | TronGrid API Key | - |
| `MONITOR_INTERVAL` | ❌ | 监控间隔（秒） | 30 |
| `PRICE_UPDATE_INTERVAL` | ❌ | 价格更新间隔（秒） | 60 |
| `LOG_LEVEL` | ❌ | 日志级别 | info |

## 📂 项目结构

```
├── src/
│   ├── index.ts           # 程序入口
│   ├── bot/               # Telegram Bot 模块
│   │   ├── index.ts       # Bot 初始化
│   │   ├── keyboards.ts   # 内联键盘
│   │   └── commands/      # 命令处理器
│   ├── chains/            # 区块链交互
│   │   ├── arbitrum.ts    # Arbitrum One
│   │   └── tron.ts        # Tron
│   ├── services/          # 服务层
│   │   ├── monitor.ts     # 监控服务
│   │   ├── price.ts       # 价格服务
│   │   └── notification.ts # 通知服务
│   ├── database/          # 数据库
│   └── utils/             # 工具函数
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🔒 安全建议

1. **限制用户访问** - 在 `.env` 中设置 `ALLOWED_USER_IDS`
2. **使用私有 RPC** - 生产环境建议使用 Alchemy/Infura 等付费 RPC 服务
3. **定期备份数据** - 备份 `./data/bot.db` 文件
4. **保护 .env 文件** - 确保 `.env` 文件权限设置为 600

## 🐛 故障排除

### 常见问题

**Q: Bot 不响应消息？**
- 检查 `TELEGRAM_BOT_TOKEN` 是否正确
- 检查 Docker 容器是否正常运行：`docker-compose ps`
- 查看日志：`docker-compose logs -f`

**Q: 无法获取 Tron 余额？**
- 确保已配置 `TRON_API_KEY`
- 检查 API Key 是否有效

**Q: 余额更新延迟？**
- 调整 `MONITOR_INTERVAL` 值
- 检查 RPC 服务是否稳定

### 查看日志
```bash
# 实时日志
docker-compose logs -f

# 最近 100 行
docker-compose logs --tail=100
```

## 📄 许可证

MIT License
