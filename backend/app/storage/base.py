from abc import ABC, abstractmethod
from typing import Optional, Tuple


class StorageProvider(ABC):
    """
    Abstract interface for permanent image and media asset storage.
    Supports LocalStorage, S3, Cloudinary, etc.
    """

    @abstractmethod
    async def save_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str = "image/png",
    ) -> Tuple[str, str]:
        """
        Saves image bytes into permanent storage.
        Returns tuple of (storage_path_or_key, public_access_url).
        """
        pass

    @abstractmethod
    async def delete_image(self, storage_path: str) -> bool:
        """
        Deletes the image from storage.
        """
        pass

    @abstractmethod
    def get_public_url(self, filename_or_key: str) -> str:
        """
        Generates public accessible URL for the stored image.
        """
        pass
