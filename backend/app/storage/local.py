import os
import uuid
from typing import Optional, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.storage.base import StorageProvider


class LocalStorageProvider(StorageProvider):
    """
    Local filesystem storage provider for generated images.
    Guarantees permanent persistence and safe file serving.
    """

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = base_dir or settings.GENERATED_IMAGES_DIR
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str = "image/png",
    ) -> Tuple[str, str]:
        # Generate a unique sanitized file name
        ext = os.path.splitext(filename)[1].lower()
        if not ext or ext not in [".png", ".jpg", ".jpeg", ".webp"]:
            ext = ".png" if "png" in content_type else ".webp" if "webp" in content_type else ".jpg"

        unique_name = f"{uuid.uuid4().hex}{ext}"
        storage_path = os.path.join(self.base_dir, unique_name)

        # Write to disk
        with open(storage_path, "wb") as f:
            f.write(image_bytes)

        public_url = self.get_public_url(unique_name)
        logger.info(f"Image stored locally: {storage_path} -> {public_url}")
        return storage_path, public_url

    async def delete_image(self, storage_path: str) -> bool:
        try:
            if storage_path and os.path.exists(storage_path):
                os.remove(storage_path)
                logger.info(f"Deleted image file at: {storage_path}")
                return True
        except Exception as e:
            logger.warning(f"Failed to delete stored image {storage_path}: {e}")
        return False

    def get_public_url(self, filename_or_key: str) -> str:
        basename = os.path.basename(filename_or_key)
        return f"{settings.API_V1_STR}/images/serve/{basename}"


def get_storage_provider() -> StorageProvider:
    # Factory returning configured storage provider
    return LocalStorageProvider()
