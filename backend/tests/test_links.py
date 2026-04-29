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