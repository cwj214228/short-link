# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

短链接管理系统（Short Link Management System）- 公司内部使用，面向小团队。

技术栈：
- 后端：FastAPI (async) + MySQL
- 前端：React + React Query
- 认证：JWT + Refresh Token

## 项目结构

```
short-link/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── main.py        # FastAPI 入口
│   │   ├── config.py      # 配置管理
│   │   ├── database.py    # 异步数据库连接
│   │   ├── models.py      # SQLAlchemy 模型
│   │   ├── schemas.py     # Pydantic 模型
│   │   ├── dependencies.py # 依赖注入
│   │   ├── routers/       # API 路由
│   │   └── services/       # 业务逻辑
│   ├── tests/              # pytest 测试
│   └── pyproject.toml     # uv 项目配置
├── frontend/               # React 前端
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── api/          # API 调用
│   │   └── App.tsx       # 路由配置
│   └── package.json
└── docs/superpowers/     # 设计文档和计划
```

## 命令

### 后端

```bash
cd backend

# 创建虚拟环境（使用 uv）
uv sync

# 激活虚拟环境
source .venv/bin/activate

# 安装开发依赖
uv sync --dev

# 运行开发服务器
uv run uvicorn app.main:app --reload --port 8000

# 运行测试
uv run pytest

# 运行测试（带监控）
uv run pytest --watch
```

### 前端

```bash
cd frontend

# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建
npm run build

# Lint
npm run lint
```

### 数据库

需要先创建 MySQL 数据库：

```sql
CREATE DATABASE shortlink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 环境变量

后端使用 `.env` 文件（参考 `backend/.env.example`）：

```bash
DATABASE_URL=mysql+aiomysql://user:password@host:3306/shortlink
SECRET_KEY=your-secret-key-change-in-production
```

## 开发注意事项

- 后端使用 `uv` 管理 Python 虚拟环境和依赖
- 前端 API 请求通过 Vite proxy 代理到 `http://localhost:8000`
- JWT Access Token 24小时过期，Refresh Token 7天过期
- 前端自动处理 Token 续期（401 时自动刷新）
