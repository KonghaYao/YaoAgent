# 构建阶段
FROM oven/bun:1.2.13 AS builder

# 创建应用目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (如果存在)
COPY package*.json ./
COPY bun.lockb .

# 安装所有依赖（包括开发依赖）
RUN bun install --registry=https://registry.npmmirror.com

COPY src ./src
COPY langgraph.json ./langgraph.json
COPY tsconfig.json ./tsconfig.json

# 编译 TypeScript
RUN bun run build

# # 生产阶段
# FROM node:22.15.0-alpine3.21 AS production

# # 创建应用目录
# WORKDIR /app

# # 从构建阶段复制编译后的代码
# COPY --from=builder /app/dist /app/dist

COPY ./src/prompt/ ./dist/src/prompt/

WORKDIR /app/dist

# 启动应用
CMD ["bun", "start.js"]