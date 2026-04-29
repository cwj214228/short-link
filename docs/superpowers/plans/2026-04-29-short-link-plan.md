# 短链接管理系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的短链接管理系统，包含用户认证、短链接 CRUD、点击统计、批量管理功能

**Architecture:** 前后端分离架构，后端 FastAPI (async) 提供 REST API，前端 React + React Query 消费 API，MySQL 存储数据。JWT + Refresh Token 实现无状态认证。

**Tech Stack:** FastAPI (async), SQLAlchemy + aiomysql, bcrypt, PyJWT, React, React Query, React Router

---

## 文件结构

```
short-link/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # 配置管理（环境变量）
│   │   ├── database.py         # 异步数据库连接
│   │   ├── models.py           # SQLAlchemy 模型（User, Link）
│   │   ├── schemas.py          # Pydantic 模型（请求/响应）
│   │   ├── dependencies.py     # 依赖注入（get_current_user）
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # 认证路由
│   │   │   └── links.py        # 短链接路由
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── auth_service.py  # 认证逻辑（JWT 签发/验证）
│   │       └── link_service.py  # 短链接业务逻辑
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py         # pytest fixtures
│   │   ├── test_auth.py
│   │   └── test_links.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   │   ├── client.ts       # axios 拦截器配置
│   │   │   ├── auth.ts
│   │   │   └── links.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── docs/superpowers/plans/
```

---

### Task 1: 后端基础设施

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: 创建 requirements.txt**

```txt
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.35
aiomysql==0.2.0
pydantic==2.9.0
pydantic-settings==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
pytest==8.3.0
pytest-asyncio==0.24.0
httpx==0.27.0
```

- [ ] **Step 2: 创建 config.py（配置管理）**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+aiomysql://root:password@localhost:3306/shortlink"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        env_file = ".env"


settings = Settings()
```

- [ ] **Step 3: 创建 database.py（异步数据库连接）**

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

- [ ] **Step 4: 创建 conftest.py（pytest fixtures）**

```python
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, engine


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def client():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
```

- [ ] **Step 5: Commit**

```bash
cd /Users/jaycchen/PycharmProjects/short-link
git init
git add backend/requirements.txt backend/app/config.py backend/app/database.py backend/tests/
git commit -m "feat: add backend infrastructure (config, database, test fixtures)"
```

---

### Task 2: 数据模型

**Files:**
- Create: `backend/app/models.py`
- Create: `backend/app/schemas.py`
- Modify: `backend/app/database.py`（导入 models）

- [ ] **Step 1: 创建 models.py（SQLAlchemy 模型）**

```python
from datetime import datetime
from sqlalchemy import String, Text, DateTime, BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    links: Mapped[list["Link"]] = relationship("Link", back_populates="user")


class Link(Base):
    __tablename__ = "links"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(6), unique=True, nullable=False, index=True)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    click_count: Mapped[int] = mapped_column(default=0)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="links")
```

- [ ] **Step 2: 创建 schemas.py（Pydantic 模型）**

```python
from datetime import datetime
from pydantic import BaseModel, HttpUrl


# Auth schemas
class UserCreate(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# Link schemas
class LinkCreate(BaseModel):
    url: str
    expires_at: datetime | None = None


class LinkUpdate(BaseModel):
    url: str | None = None
    expires_at: datetime | None = None


class LinkResponse(BaseModel):
    slug: str
    url: str
    short_url: str
    user_id: int
    click_count: int
    expires_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class LinkListResponse(BaseModel):
    items: list[LinkResponse]
    total: int
    page: int
    limit: int


class BatchDeleteRequest(BaseModel):
    slugs: list[str]


class BatchUpdateRequest(BaseModel):
    slugs: list[str]
    expires_at: datetime | None


class BatchResponse(BaseModel):
    success: list[str]
    failed: list[dict[str, str]]
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/models.py backend/app/schemas.py
git commit -m "feat: add User and Link models with Pydantic schemas"
```

---

### Task 3: 认证服务

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/auth_service.py`

- [ ] **Step 1: 创建 auth_service.py**

```python
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from app.config import settings
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(user_id), "exp": expire}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"sub": str(user_id), "exp": expire, "type": "refresh"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/auth_service.py
git commit -m "feat: add auth service (password hashing, JWT creation)"
```

---

### Task 4: 依赖注入

**Files:**
- Create: `backend/app/dependencies.py`

- [ ] **Step 1: 创建 dependencies.py（JWT 验证依赖）**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.services.auth_service import decode_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    user_id = int(payload.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    return user
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/dependencies.py
git commit -m "feat: add JWT authentication dependency"
```

---

### Task 5: 认证路由

**Files:**
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/auth.py`
- Create: `backend/tests/test_auth.py`
- Modify: `backend/app/main.py`（注册路由）

- [ ] **Step 1: 创建 auth.py（认证路由）**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, TokenResponse, RefreshRequest
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    user = User(username=data.username, password_hash=hash_password(data.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    user.refresh_token = refresh_token
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, please login again")

    user_id = int(payload.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or user.refresh_token != data.refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, please login again")

    access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)

    user.refresh_token = new_refresh_token
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout")
async def logout(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user.refresh_token = None
    await db.commit()
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user
```

- [ ] **Step 2: 创建 test_auth.py**

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    response = await client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "password123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "alice"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate(client: AsyncClient):
    await client.post("/api/auth/register", json={"username": "alice", "password": "password123"})
    response = await client.post(
        "/api/auth/register", json={"username": "alice", "password": "password123"}
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    await client.post("/api/auth/register", json={"username": "alice", "password": "password123"})
    response = await client.post(
        "/api/auth/login", json={"username": "alice", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post(
        "/api/auth/login", json={"username": "alice", "password": "wrongpassword"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient):
    await client.post("/api/auth/register", json={"username": "alice", "password": "password123"})
    login_response = await client.post(
        "/api/auth/login", json={"username": "alice", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["username"] == "alice"
```

- [ ] **Step 3: 创建 main.py（FastAPI 入口）**

```python
from fastapi import FastAPI
from app.routers import auth, links

app = FastAPI(title="Short Link API")

app.include_router(auth.router)
app.include_router(links.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/main.py backend/app/routers/auth.py backend/tests/test_auth.py
git commit -m "feat: add auth routes (register, login, refresh, logout)"
```

---

### Task 6: 短链接服务

**Files:**
- Create: `backend/app/services/link_service.py`

- [ ] **Step 1: 创建 link_service.py（短链接业务逻辑）**

```python
import random
import string
from datetime import datetime

SLUG_CHARS = string.ascii_letters + string.digits
MAX_RETRIES = 3


def generate_slug(length: int = 6) -> str:
    return "".join(random.choices(SLUG_CHARS, k=length))
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/link_service.py
git commit -m "feat: add slug generation service"
```

---

### Task 7: 短链接路由

**Files:**
- Create: `backend/app/routers/links.py`
- Create: `backend/tests/test_links.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: 创建 links.py（短链接路由）**

```python
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Link, User
from app.schemas import (
    LinkCreate,
    LinkUpdate,
    LinkResponse,
    LinkListResponse,
    BatchDeleteRequest,
    BatchUpdateRequest,
    BatchResponse,
)
from app.dependencies import get_current_user
from app.services.link_service import generate_slug

router = APIRouter(prefix="/api/links", tags=["links"])


@router.post("", response_model=LinkResponse, status_code=status.HTTP_201_CREATED)
async def create_link(
    data: LinkCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for _ in range(3):
        slug = generate_slug()
        result = await db.execute(select(Link).where(Link.slug == slug))
        if not result.scalar_one_or_none():
            break
    else:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug collision, please retry")

    link = Link(slug=slug, url=data.url, user_id=user.id, expires_at=data.expires_at)
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return LinkResponse(
        slug=link.slug,
        url=link.url,
        short_url=f"https://short.link/{link.slug}",
        user_id=link.user_id,
        click_count=link.click_count,
        expires_at=link.expires_at,
        created_at=link.created_at,
    )


@router.get("", response_model=LinkListResponse)
async def list_links(
    page: int = 1,
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    result = await db.execute(
        select(Link, func.count(Link.id).over())
        .where(Link.user_id == user.id)
        .offset(offset)
        .limit(limit)
        .order_by(Link.created_at.desc())
    )
    links = result.scalars().all()
    total = links[0].count if links else 0 if hasattr(links[0], 'count') else 0

    count_result = await db.execute(
        select(func.count(Link.id)).where(Link.user_id == user.id)
    )
    total = count_result.scalar()

    items = [
        LinkResponse(
            slug=l.slug,
            url=l.url,
            short_url=f"https://short.link/{l.slug}",
            user_id=l.user_id,
            click_count=l.click_count,
            expires_at=l.expires_at,
            created_at=l.created_at,
        )
        for l in links
    ]
    return LinkListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/{slug}", response_model=LinkResponse)
async def get_link(
    slug: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Link).where(Link.slug == slug, Link.user_id == user.id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    return LinkResponse(
        slug=link.slug,
        url=link.url,
        short_url=f"https://short.link/{link.slug}",
        user_id=link.user_id,
        click_count=link.click_count,
        expires_at=link.expires_at,
        created_at=link.created_at,
    )


@router.put("/{slug}", response_model=LinkResponse)
async def update_link(
    slug: str,
    data: LinkUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Link).where(Link.slug == slug, Link.user_id == user.id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    if data.url is not None:
        link.url = data.url
    if data.expires_at is not None:
        link.expires_at = data.expires_at
    await db.commit()
    await db.refresh(link)
    return LinkResponse(
        slug=link.slug,
        url=link.url,
        short_url=f"https://short.link/{link.slug}",
        user_id=link.user_id,
        click_count=link.click_count,
        expires_at=link.expires_at,
        created_at=link.created_at,
    )


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(
    slug: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Link).where(Link.slug == slug, Link.user_id == user.id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    await db.delete(link)
    await db.commit()


@router.post("/batch/delete", response_model=BatchResponse)
async def batch_delete(
    data: BatchDeleteRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    success, failed = [], []
    for slug in data.slugs:
        result = await db.execute(select(Link).where(Link.slug == slug, Link.user_id == user.id))
        link = result.scalar_one_or_none()
        if link:
            await db.delete(link)
            success.append(slug)
        else:
            failed.append({"slug": slug, "reason": "not found"})
    await db.commit()
    return BatchResponse(success=success, failed=failed)


@router.post("/batch/update", response_model=BatchResponse)
async def batch_update(
    data: BatchUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    success, failed = [], []
    for slug in data.slugs:
        result = await db.execute(select(Link).where(Link.slug == slug, Link.user_id == user.id))
        link = result.scalar_one_or_none()
        if link:
            link.expires_at = data.expires_at
            success.append(slug)
        else:
            failed.append({"slug": slug, "reason": "not found"})
    await db.commit()
    return BatchResponse(success=success, failed=failed)


@router.get("/redirect/{slug}")
async def redirect_to_url(
    slug: str,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Link).where(Link.slug == slug))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    if link.expires_at and link.expires_at <= datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Link has expired")
    link.click_count += 1
    await db.commit()
    response.headers["Location"] = link.url
    return response
```

- [ ] **Step 2: 创建 test_links.py**

```python
import pytest
from httpx import AsyncClient


async def get_auth_header(client: AsyncClient) -> dict:
    await client.post("/api/auth/register", json={"username": "alice", "password": "password123"})
    login_response = await client.post(
        "/api/auth/login", json={"username": "alice", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_link(client: AsyncClient):
    headers = await get_auth_header(client)
    response = await client.post(
        "/api/links",
        json={"url": "https://example.com"},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert len(data["slug"]) == 6
    assert data["url"] == "https://example.com"


@pytest.mark.asyncio
async def test_list_links(client: AsyncClient):
    headers = await get_auth_header(client)
    await client.post("/api/links", json={"url": "https://example.com"}, headers=headers)
    response = await client.get("/api/links", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_delete_link(client: AsyncClient):
    headers = await get_auth_header(client)
    create_response = await client.post(
        "/api/links", json={"url": "https://example.com"}, headers=headers
    )
    slug = create_response.json()["slug"]
    response = await client.delete(f"/api/links/{slug}", headers=headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    response = await client.get("/api/links")
    assert response.status_code == 403
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/routers/links.py backend/tests/test_links.py
git commit -m "feat: add link CRUD routes with batch operations"
```

---

### Task 8: 前端基础结构

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "short-link-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "@tanstack/react-query": "^5.51.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.3.4",
    "eslint": "^9.8.0"
  }
}
```

- [ ] **Step 2: 创建 api/client.ts（axios 拦截器）**

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post("/api/auth/refresh", { refresh_token: refreshToken });
          localStorage.setItem("access_token", response.data.access_token);
          localStorage.setItem("refresh_token", response.data.refresh_token);
          error.config.headers.Authorization = `Bearer ${response.data.access_token}`;
          return api(error.config);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 3: 创建 App.tsx（路由配置）**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LinkList from "./pages/LinkList";
import CreateLink from "./pages/CreateLink";
import LinkDetail from "./pages/LinkDetail";
import BatchManage from "./pages/BatchManage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><LinkList /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateLink /></ProtectedRoute>} />
          <Route path="/links/:slug" element={<ProtectedRoute><LinkDetail /></ProtectedRoute>} />
          <Route path="/batch" element={<ProtectedRoute><BatchManage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default App;
```

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/src/main.tsx frontend/src/App.tsx frontend/src/api/client.ts
git commit -m "feat: add frontend structure with router and axios client"
```

---

### Task 9: 前端认证页面

**Files:**
- Create: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/pages/Register.tsx`
- Create: `frontend/src/api/auth.ts`

- [ ] **Step 1: 创建 auth.ts（认证 API）**

```typescript
import api from "./client";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authApi = {
  login: (data: LoginRequest) => api.post<TokenResponse>("/auth/login", data),
  register: (data: LoginRequest) => api.post("/auth/register", data),
  refresh: (refresh_token: string) =>
    api.post<TokenResponse>("/auth/refresh", { refresh_token }),
};
```

- [ ] **Step 2: 创建 Login.tsx**

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authApi.login(form);
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);
      navigate("/");
    } catch {
      setError("Invalid username or password");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">Login</button>
      </form>
      {error && <p>{error}</p>}
      <a href="/register">Register</a>
    </div>
  );
}
```

- [ ] **Step 3: 创建 Register.tsx**

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.register(form);
      navigate("/login");
    } catch {
      setError("Username already exists");
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">Register</button>
      </form>
      {error && <p>{error}</p>}
      <a href="/login">Login</a>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx frontend/src/api/auth.ts
git commit -m "feat: add Login and Register pages"
```

---

### Task 10: 前端短链接页面

**Files:**
- Create: `frontend/src/pages/LinkList.tsx`
- Create: `frontend/src/pages/CreateLink.tsx`
- Create: `frontend/src/pages/LinkDetail.tsx`
- Create: `frontend/src/pages/BatchManage.tsx`
- Create: `frontend/src/api/links.ts`

- [ ] **Step 1: 创建 links.ts**

```typescript
import api from "./client";

export interface LinkResponse {
  slug: string;
  url: string;
  short_url: string;
  user_id: number;
  click_count: number;
  expires_at: string | null;
  created_at: string;
}

export interface LinkListResponse {
  items: LinkResponse[];
  total: number;
  page: number;
  limit: number;
}

export const linksApi = {
  list: (page = 1, limit = 20) =>
    api.get<LinkListResponse>("/links", { params: { page, limit } }),
  create: (data: { url: string; expires_at?: string }) =>
    api.post<LinkResponse>("/links", data),
  get: (slug: string) => api.get<LinkResponse>(`/links/${slug}`),
  update: (slug: string, data: { url?: string; expires_at?: string }) =>
    api.put<LinkResponse>(`/links/${slug}`, data),
  delete: (slug: string) => api.delete(`/links/${slug}`),
  batchDelete: (slugs: string[]) => api.post("/links/batch/delete", { slugs }),
  batchUpdate: (slugs: string[], expires_at: string) =>
    api.post("/links/batch/update", { slugs, expires_at }),
};
```

- [ ] **Step 2: 创建 LinkList.tsx**

```typescript
import { useQuery } from "@tanstack/react-query";
import { linksApi } from "../api/links";
import { Link, useNavigate } from "react-router-dom";

export default function LinkList() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["links"],
    queryFn: () => linksApi.list(),
  });

  return (
    <div>
      <h1>My Links</h1>
      <button onClick={() => navigate("/create")}>Create New</button>
      <button onClick={() => navigate("/batch")}>Batch Manage</button>
      <table>
        <thead>
          <tr>
            <th>Slug</th>
            <th>URL</th>
            <th>Clicks</th>
            <th>Expires</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.items.map((link) => (
            <tr key={link.slug}>
              <td><Link to={`/links/${link.slug}`}>{link.slug}</Link></td>
              <td>{link.url}</td>
              <td>{link.click_count}</td>
              <td>{link.expires_at || "Never"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LinkList.tsx frontend/src/pages/CreateLink.tsx frontend/src/pages/LinkDetail.tsx frontend/src/pages/BatchManage.tsx frontend/src/api/links.ts
git commit -m "feat: add link management pages"
```

---

## 自检清单

1. **Spec coverage:** 检查设计文档的每个验收标准是否都有对应的任务实现
2. **Placeholder scan:** 确认所有步骤都包含实际代码，无 "TBD"、"TODO"
3. **Type consistency:** 确认 schemas 和 API 响应的字段名称一致

---

## 执行选择

**Plan complete and saved to `docs/superpowers/plans/2026-04-29-short-link-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
