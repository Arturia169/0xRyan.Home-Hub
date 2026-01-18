# 🌌 Cyber Home | 赛博极简终端仪表盘

一款专为极客打造的个性化、通透直观的桌面主页终端。它不仅是一个导航页，更是你数字世界的实时监控中心。

![Cyber Home Preview](file:///C:/Users/Administrator/.gemini/antigravity/brain/0afb10dc-2f94-49b8-9f58-3e67ec3a7fd2/cyber_home_final_view_1768670025752.png)

## ✨ 功能亮点

- **🕒 极客计时器**: 内置复古效果的翻页时钟 (FlipClock)，精准同步系统时间。
- **💰 实时资产监控**: 
  - 自动读取 **crypto-wallet-monitor** 后端数据。
  - 支持 **Arbitrum One** 与 **Tron** 链上余额实时汇总。
  - 资产变动趋势曲线图 (Area Chart)。
- **🐙 GitHub 贡献仪表盘**: 
  - 实时同步你的 GitHub 年度活跃热力图。
  - 动态渲染提交强度感应灯。
- **🐳 系统与 Docker 监控**: 
  - 直观显示宿主机 (J1800) 的核心负载（CPU/内存）。
  - 实时监控关键 Docker 容器运行状态。
- **⌨️ 交互式搜索终端**: 
  - 支持快捷指令如 `/gh` (搜索 GitHub)、`/gpt` (直达 ChatGPT)。
  - 高级通透磨砂玻璃感搜索框。

## 🎨 设计美学

- **赛博蓝氛围**: 顶部的柔和霓虹青色背光。
- **极致通透**: 全卡片采用磨砂玻璃 (Glassmorphism) 效果。
- **动态呼吸**: 所有的交互均带有 Subtle Micro-animations 丝滑动效。

## 🛠️ 技术栈

- **核心框架**: React 18 + Vite
- **动效引擎**: Framer Motion
- **图表系统**: Recharts
- **图标**: Lucide React
- **部署**: Docker / Nginx

## 🚀 快速启动 (J1800 宿主机)

确保你已经配置好了 [crypto-wallet-monitor](https://github.com/Arturia169/crypto-wallet-monitor) 后端，然后按照以下步骤部署：

```bash
# 1. 克隆项目
git clone https://github.com/Arturia169/0xRyan.Home.git
cd 0xRyan.Home

# 2. 一键构建并运行
docker compose up -d --build
```

部署完成后，通过浏览器访问：`http://你的宿主机IP:1145`

## 🔗 数据对接建议

本主页目前通过 `192.168.5.100:3000` 与后端通信。如需更改 API 路径，请修改 `src/App.tsx` 中的 `API_BASE` 常量。

---
**Made with ❤️ by RYAN**
