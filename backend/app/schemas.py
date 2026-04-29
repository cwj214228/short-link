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
