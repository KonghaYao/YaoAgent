# PostgreSQL 配置指南

LangGraph Server 不使用内存实现 checkpoint 和 Ops 数据的持久化，所以需要 PostgresSQL 进行持久化。

本指南介绍如何通过 Docker Compose 设置 LangGraph Server 与 PostgreSQL 的集成。

## Docker 环境配置

使用以下 docker-compose.yml 文件配置 PostgreSQL 和 LangGraph Server：

```yaml
version: '3'

services:
  postgres:
    image: postgres:16
    environment:
      - POSTGRES_USER=langgraph_user
      - POSTGRES_PASSWORD=your_secure_password
      - POSTGRES_DB=langgraph
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U langgraph_user -d langgraph"]
      interval: 5s
      timeout: 5s
      retries: 5

  langgraph-server:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgres://langgraph_user:your_secure_password@postgres:5432/langgraph
      # - DATABASE_INIT=true
    ports:
      - "8123:8123"

volumes:
  postgres-data:
```

## 环境变量说明

LangGraph Server 通过以下环境变量配置数据库连接：

- `DATABASE_URL`: 数据库连接字符串，格式为 `postgres://用户名:密码@主机:端口/数据库名`
- `DATABASE_INIT`: 控制是否初始化数据库表结构（首次运行设为 true，后续删除）

## 启动服务

运行以下命令启动服务：

```bash
docker-compose up -d
```

首次运行后，将 `DATABASE_INIT` 删除以避免重复初始化数据库结构。
