import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_conversation_lifecycle(client: AsyncClient):
    # 1. Register & Login
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "chatuser@example.com", "password": "password123", "full_name": "Chat User"},
    )
    assert reg_res.status_code == 201
    
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "chatuser@example.com", "password": "password123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Conversation
    create_res = await client.post(
        "/api/v1/conversations",
        headers=headers,
        json={"title": "Python Architecture Discussion"},
    )
    assert create_res.status_code == 201
    conv = create_res.json()
    conv_id = conv["id"]
    assert conv["title"] == "Python Architecture Discussion"

    # 3. List Conversations
    list_res = await client.get("/api/v1/conversations", headers=headers)
    assert list_res.status_code == 200
    conversations = list_res.json()
    assert len(conversations) >= 1
    assert any(c["id"] == conv_id for c in conversations)

    # 4. Update Conversation Title
    patch_res = await client.patch(
        f"/api/v1/conversations/{conv_id}",
        headers=headers,
        json={"title": "Updated Architecture Title", "is_pinned": True},
    )
    assert patch_res.status_code == 200
    updated_conv = patch_res.json()
    assert updated_conv["title"] == "Updated Architecture Title"
    assert updated_conv["is_pinned"] is True

    # 5. Delete Conversation
    del_res = await client.delete(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert del_res.status_code == 204
