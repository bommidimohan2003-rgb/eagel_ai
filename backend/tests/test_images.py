import pytest
from httpx import AsyncClient
from app.providers.image_provider import MockImageProvider, PollinationsImageProvider, ProviderRegistry
from app.services.image_intent_service import ImageIntentService, IntentType


@pytest.mark.asyncio
async def test_image_intent_detection():
    # Test text classification
    text_res = ImageIntentService.detect_intent("Explain how binary search works in Python.")
    assert text_res["intent"] == IntentType.TEXT

    # Test image generation classification
    img_res = ImageIntentService.detect_intent("Generate an image of a cyberpunk city at night with neon lights")
    assert img_res["intent"] == IntentType.IMAGE_GENERATION

    img_res2 = ImageIntentService.detect_intent("Create a photo of a cute golden retriever in space")
    assert img_res2["intent"] == IntentType.IMAGE_GENERATION

    # Test image edit classification
    edit_res = ImageIntentService.detect_intent("Make it darker and remove the background")
    assert edit_res["intent"] == IntentType.IMAGE_EDIT


@pytest.mark.asyncio
async def test_mock_image_provider():
    provider = MockImageProvider()
    results = await provider.generate_image(
        prompt="A futuristic neon skyline",
        aspect_ratio="16:9",
        number_of_images=1,
    )
    assert len(results) == 1
    assert results[0].width == 1280
    assert results[0].height == 720
    assert results[0].image_bytes is not None
    assert results[0].provider == "mock"


@pytest.mark.asyncio
async def test_provider_registry():
    provider = ProviderRegistry.get_provider("mock")
    assert isinstance(provider, MockImageProvider)


@pytest.mark.asyncio
async def test_image_api_flow(client: AsyncClient):
    # 1. Register and login a test user
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "image_tester@example.com", "password": "password123", "full_name": "Image Tester"},
    )
    assert reg_res.status_code == 201

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "image_tester@example.com", "password": "password123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Generate Image with mock model to avoid network in unit test
    gen_res = await client.post(
        "/api/v1/images/generate",
        headers=headers,
        json={
            "prompt": "Cyberpunk robotic eagle hovering over futuristic neon city",
            "aspect_ratio": "16:9",
            "style": "Cinematic",
            "model": "mock",
        },
    )
    assert gen_res.status_code == 201
    data = gen_res.json()
    assert data["success"] is True
    assert len(data["images"]) == 1
    image_id = data["images"][0]["id"]
    image_url = data["images"][0]["url"]
    assert image_id is not None
    assert image_url is not None

    # 3. List images
    list_res = await client.get("/api/v1/images", headers=headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert any(img["id"] == image_id for img in list_data["images"])

    # 4. Get single image
    single_res = await client.get(f"/api/v1/images/{image_id}", headers=headers)
    assert single_res.status_code == 200
    assert single_res.json()["id"] == image_id

    # 5. Delete image
    del_res = await client.delete(f"/api/v1/images/{image_id}", headers=headers)
    assert del_res.status_code == 204

    # 6. Verify image is deleted
    get_after_del = await client.get(f"/api/v1/images/{image_id}", headers=headers)
    assert get_after_del.status_code == 404
