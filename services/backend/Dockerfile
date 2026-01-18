# --- 阶段 1: 编译阶段 ---
FROM node:22-slim AS builder
WORKDIR /app

# 安装构建依赖 (better-sqlite3 等原生模块需要)
RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# --- 阶段 2: 运行阶段 ---
FROM node:22-slim AS runner
WORKDIR /app

# 安装运行时需要的库
RUN apt-get update && apt-get install -y python3 && rm -rf /var/lib/apt/lists/*

# 从构建阶段复制文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 准备数据目录
RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV DB_PATH=/app/data/bot.db
VOLUME ["/app/data"]

# 暴露 API 端口
EXPOSE 3000

CMD ["node", "dist/index.js"]
