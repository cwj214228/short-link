# 短链接管理系统设计

**日期:** 2026-04-29
**项目:** Short Link Management System
**状态:** 已批准

---

## 1. 项目概述

公司内部使用的短链接管理系统，面向小团队（10人以内）。支持创建短链接、点击统计、过期策略和批量管理，无需对接公司现有用户系统。

---

## 2. 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React（静态部署） |
| 后端 | FastAPI（async） |
| 数据库 | MySQL |
| 认证 | JWT（无状态） |
| 部署 | 公司服务器 |

### 技术选型理由

- **FastAPI async**: 高性能异步框架，适合 I/O 密集型短链接重定向场景
- **React + React Query**: 前后端分离，前端独立迭代，React Query 管理服务端状态减少样板代码
- **MySQL**: 公司内部常用数据库，运维成本低
- **JWT**: 无状态认证，适合内部服务，去中心化无需 session 存储

---

## 3. 架构设计

### 3.1 系统架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Nginx     │────▶│  FastAPI    │
│   (React)   │     │  (静态资源)  │     │   :8000     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                                           ┌─────▼─────┐
                                           │   MySQL   │
                                           │   :3306   │
                                           └───────────┘
```

### 3.2 前后端分离

- FastAPI 作为纯 API 服务（端口 8000）
- React 构建为纯静态资源，通过 Nginx 或 FastAPI 直接托管
- API 通信使用 JSON

### 3.3 项目结构

```
short-link/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # 配置管理
│   │   ├── database.py         # 数据库连接
│   │   ├── models.py           # SQLAlchemy 模型
│   │   ├── schemas.py          # Pydantic 模型
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # 认证路由（注册/登录）
│   │   │   └── links.py        # 短链接 CRUD 路由
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py  # JWT 认证逻辑
│   │   │   └── link_service.py  # 短链接业务逻辑
│   │   └── dependencies.py     # 依赖注入（get_current_user）
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx       # 登录页
│   │   │   ├── Register.tsx     # 注册页
│   │   │   ├── LinkList.tsx     # 链接列表页
│   │   │   ├── CreateLink.tsx   # 创建链接页
│   │   │   ├── LinkDetail.tsx   # 链接详情页
│   │   │   └── BatchManage.tsx  # 批量管理页
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   │   ├── auth.ts         # 认证 API 调用
│   │   │   └── links.ts        # 短链接 API 调用
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── docs/
│   └── specs/
└── CLAUDE.md
```

---

## 4. 数据模型

### 4.1 users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| username | VARCHAR(50) | 用户名，唯一，非空 |
| password_hash | VARCHAR(255) | 密码哈希（非明文），非空 |
| refresh_token | VARCHAR(255) | Refresh Token（可NULL，过期或登出时清空） |
| created_at | DATETIME | 注册时间 |

**索引:**
- `username` 上建立唯一索引

### 4.2 links 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| slug | VARCHAR(6) | 短链接标识，唯一，非空 |
| url | TEXT | 原始目标 URL，非空 |
| user_id | BIGINT | 创建者用户 ID，外键 → users.id |
| click_count | INT | 点击次数，默认 0 |
| expires_at | DATETIME | 过期时间，NULL 表示永不过期 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**索引:**
- `slug` 上建立唯一索引
- `user_id` 上建立普通索引支持按用户筛选

---

## 5. API 设计

### 5.1 认证 API

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 用户注册 | 否 |
| POST | /api/auth/login | 用户登录，返回 JWT + Refresh Token | 否 |
| POST | /api/auth/refresh | 使用 Refresh Token 续期 | 否 |
| POST | /api/auth/logout | 登出，清空 Refresh Token | JWT |
| GET | /api/auth/me | 获取当前用户信息 | JWT |

**POST /api/auth/register**
```json
// Request
{
  "username": "alice",
  "password": "securepass123"
}

// Response 201
{
  "id": 1,
  "username": "alice",
  "created_at": "2026-04-29T12:00:00"
}
```

**POST /api/auth/login**
```json
// Request
{
  "username": "alice",
  "password": "securepass123"
}

// Response 200
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",   // 24小时有效期
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...", // 7天有效期
  "token_type": "bearer"
}
```

**POST /api/auth/refresh**
```json
// Request
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}

// Response 200
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",  // 新 JWT
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...", // 新 Refresh Token（轮换）
  "token_type": "bearer"
}
```

### 5.2 短链接 CRUD

所有短链接 API 均需携带 JWT Bearer Token（`Authorization: Bearer <token>`）。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/links | 创建短链接 |
| GET | /api/links | 获取当前用户链接列表（支持分页） |
| GET | /api/links/{slug} | 获取单个链接详情 |
| PUT | /api/links/{slug} | 更新链接（URL、过期时间） |
| DELETE | /api/links/{slug} | 删除单个链接 |
| POST | /api/links/batch/delete | 批量删除 |
| POST | /api/links/batch/update | 批量更新过期时间 |

### 5.3 点击重定向

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /{slug} | 短链接访问入口，302 重定向 | 否（公开） |

### 5.4 请求/响应示例

**POST /api/links**
```json
// Request (headers: Authorization: Bearer <token>)
{
  "url": "https://example.com/very/long/path",
  "expires_at": "2026-12-31T23:59:59"
}

// Response 201
{
  "slug": "aB3xY9",
  "url": "https://example.com/very/long/path",
  "short_url": "https://short.link/aB3xY9",
  "user_id": 1,
  "click_count": 0,
  "expires_at": "2026-12-31T23:59:59",
  "created_at": "2026-04-29T12:00:00"
}
```

**GET /api/links?page=1&limit=20**
```json
// Response 200
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

## 6. 核心业务逻辑

### 6.1 用户认证（JWT + Refresh Token）

1. **用户注册**：密码使用 bcrypt 哈希后存储，不可逆
2. **用户登录**：验证密码，成功则签发：
   - Access Token（JWT）：24小时有效期，用于 API 请求认证
   - Refresh Token：7天有效期，用于静默续期
3. **JWT Payload**: `{ "sub": user_id, "exp": expiry_timestamp }`
4. **Token 续期**：Access Token 即将过期时（前端检测），使用 Refresh Token 调用 `/api/auth/refresh`，获取新 Token 对（Refresh Token 轮换）
5. **登出**：清除数据库中的 Refresh Token
6. **Refresh Token 失效场景**：
   - 过期（7天未使用）
   - 用户主动登出
   - 用户再次登录（旧 Refresh Token 失效）
7. **前端 Token 管理**：
   - Access Token：存储于 localStorage
   - Refresh Token：存储于 httpOnly Cookie（更安全，防止 XSS 读取）或 localStorage
   - 拦截器：检测到 401 且非 /api/auth/refresh 请求时，自动用 Refresh Token 续期
   - 续期失败（Refresh Token 也无效）则清除状态，重定向到登录页

### 6.2 短链接生成

1. 服务端生成 6 位随机字符（字母数字，区分大小写）
2. 检查 slug 是否已存在（唯一索引约束）
3. 若碰撞，重试最多 3 次
4. 3 次后返回 409 Conflict 错误

### 6.3 点击重定向

1. 根据 slug 查询 links 表
2. 若不存在，返回 404
3. 若已过期（expires_at <= NOW，且非 NULL），返回 410 Gone
4. 否则返回 302 重定向到目标 URL，同时异步更新 click_count + 1

### 6.4 批量操作

- 批量删除：接收 slug 列表，逐个删除
- 批量更新：接收 slug 列表和新过期时间，逐个更新
- 部分失败时返回已成功/已失败列表，不回滚已成功的操作

---

## 7. 错误处理

| 场景 | HTTP 状态码 | 响应 body |
|------|------------|----------|
| 用户名已存在 | 409 Conflict | `{"detail": "Username already exists"}` |
| 用户名或密码错误 | 401 Unauthorized | `{"detail": "Invalid username or password"}` |
| 未提供/无效 JWT | 401 Unauthorized | `{"detail": "Not authenticated"}` |
| Refresh Token 无效/过期 | 401 Unauthorized | `{"detail": "Session expired, please login again"}` |
| slug 碰撞（重试耗尽） | 409 Conflict | `{"detail": "Slug collision, please retry"}` |
| 链接不存在 | 404 Not Found | `{"detail": "Link not found"}` |
| 链接已过期 | 410 Gone | `{"detail": "Link has expired"}` |
| 目标 URL 无效 | 302 | 仍重定向，记录警告日志 |
| 参数校验失败 | 422 Unprocessable Entity | `{"detail": [...]}` |

---

## 8. 前端页面

### 8.1 页面列表

| 页面 | 路径 | 功能 | 认证 |
|------|------|------|------|
| 登录 | /login | 用户登录 | 否（公开） |
| 注册 | /register | 用户注册 | 否（公开） |
| 链接列表 | / | 展示当前用户链接，支持分页 | 需登录 |
| 创建链接 | /create | 新建短链接 | 需登录 |
| 链接详情 | /links/:slug | 查看链接统计 | 需登录 |
| 批量管理 | /batch | 勾选多链接，批量删除/设置过期 | 需登录 |

### 8.2 路由守卫

- 未登录用户访问需认证页面 → 重定向到 /login
- 已登录用户访问 /login 或 /register → 重定向到 /
- JWT 存储在 localStorage，前端通过 axios/fetch interceptor 自动附加到请求头

### 8.3 状态管理

- React Query 管理 API 状态（缓存、轮询、乐观更新）
- 链接详情页每 30 秒轮询一次 click_count

### 8.3 UI 设计方向

- 简洁、内部工具风格，无复杂品牌元素
- 表格视图展示链接列表，支持多选
- 弹窗或侧边栏进行快捷操作

---

## 9. 部署方案

### 9.1 服务器部署

1. **后端**: FastAPI 通过 `uvicorn --host 0.0.0.0 --port 8000` 启动，配合 systemd 管理进程
2. **前端**: `npm run build` 构建静态资源，Nginx 托管或 FastAPI 托管
3. **数据库**: MySQL 已在公司服务器运行，通过环境变量连接

### 9.2 环境变量

```bash
# backend/.env
DATABASE_URL=mysql+aiomysql://user:pass@host:3306/shortlink
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
```

### 9.3 Nginx 配置（可选）

```nginx
server {
    listen 80;
    server_name short.link;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
    }

    location / {
        root /var/www/short-link/static;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 10. 验收标准

### 认证
- [ ] 用户可以注册，密码加密存储
- [ ] 用户可以登录，获取 Access Token + Refresh Token
- [ ] 未登录状态访问 /api/links/* 返回 401
- [ ] 有效 JWT 可以正常访问受保护接口
- [ ] Access Token 过期后，使用 Refresh Token 可自动续期
- [ ] Refresh Token 过期或无效时，重定向到登录页
- [ ] 用户登出后 Refresh Token 被清除
- [ ] 路由守卫：未登录重定向到 /login

### 短链接
- [ ] 创建短链接返回 6 位 slug，可访问并 302 重定向
- [ ] 点击统计在重定向时异步 +1
- [ ] 过期链接返回 410 Gone
- [ ] 批量删除和批量更新过期时间功能正常
- [ ] 链接列表支持分页，当前用户只能看到自己的链接
- [ ] slug 碰撞自动重试，最多 3 次

### 开发/构建
- [ ] 前端可在开发环境 `npm run dev` 运行
- [ ] 后端可在开发环境 `uvicorn main:app --reload` 运行
- [ ] 生产构建 `npm run build` 成功
