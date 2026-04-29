from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
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
    count_result = await db.execute(
        select(func.count(Link.id)).where(Link.user_id == user.id)
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(Link)
        .where(Link.user_id == user.id)
        .offset(offset)
        .limit(limit)
        .order_by(Link.created_at.desc())
    )
    links = result.scalars().all()

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