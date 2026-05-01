# 短链接管理系统

赛博朋克风格的短链接管理平台，支持创建、分享、追踪短链接。

## 技术栈

- **后端**: FastAPI (async) + SQLAlchemy + MySQL
- **前端**: React + TypeScript + React Query
- **认证**: JWT + Refresh Token

## 快速开始

### 前置条件

- Node.js 18+
- Python 3.11+
- MySQL 8.0+

### 1. 克隆项目

```bash
git clone <repository-url>
cd short-link
```

### 2. 后端设置

```bash
cd backend

# 创建虚拟环境
uv sync

# 复制环境变量文件
cp .env.example .env
# 编辑 .env 配置数据库连接

# 创建数据库
mysql -u root -p -e "CREATE DATABASE shortlink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 运行开发服务器
uv run uvicorn app.main:app --reload --port 8000
```

### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

### 4. 访问

- 前端: http://localhost:5173
- 后端 API: http://localhost:8000

## 功能

- 用户注册/登录
- 创建短链接（支持自定义过期时间）
- 短链接列表（支持搜索和分页）
- 批量管理（批量删除、更新过期时间）
- 短链接访问统计
- 一键复制短链接

## 项目结构

```
short-link/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── main.py        # 入口
│   │   ├── config.py      # 配置
│   │   ├── database.py    # 数据库连接
│   │   ├── models.py      # 数据模型
│   │   ├── schemas.py     # Pydantic 模型
│   │   ├── dependencies.py # 依赖注入
│   │   ├── routers/       # API 路由
│   │   │   ├── auth.py    # 认证
│   │   │   └── links.py   # 链接管理
│   │   └── services/       # 业务逻辑
│   └── tests/              # 测试
├── frontend/               # React 前端
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── api/          # API 调用
│   │   ├── styles/       # 样式文件
│   │   └── App.tsx       # 路由配置
│   └── package.json
└── docs/superpowers/     # 设计文档
```

## 设计风格

采用赛博朋克 + 雨夜主题，包含：
- 霓虹色彩（青色、品红、紫色）
- HUD 风格 UI 元素
- 动态雨滴效果
- 发光边框和角落装饰

## API 端点

### 认证

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新 Token

### 链接管理

- `GET /api/links` - 列表（支持分页、搜索）
- `POST /api/links` - 创建
- `GET /api/links/:slug` - 详情
- `PUT /api/links/:slug` - 更新
- `DELETE /api/links/:slug` - 删除
- `GET /api/links/redirect/:slug` - 重定向
- `POST /api/links/batch/delete` - 批量删除
- `POST /api/links/batch/update` - 批量更新

## License

MIT