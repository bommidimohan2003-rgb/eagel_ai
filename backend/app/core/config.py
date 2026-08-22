import os
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Eagle AI Assistant"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Security & Auth
    JWT_SECRET: str = "dev-secret-key-nemotron-assistant-min-32-chars-long-abc-123"
    JWT_REFRESH_SECRET: str = "dev-refresh-secret-key-nemotron-assistant-min-32-chars-xyz-789"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Database: MySQL Workbench or Vercel Serverless SQLite fallback
    DATABASE_URL: str = (
        "sqlite+aiosqlite:////tmp/nemotron.db"
        if os.environ.get("VERCEL") and not os.environ.get("DATABASE_URL")
        else "mysql+aiomysql://root:Bmohan@localhost:3306/nemotron_db"
    )
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False

    # AI Configuration (OpenRouter / NVIDIA Nemotron API Key)
    NVIDIA_API_KEY: str = "your-api-key-here"
    NVIDIA_BASE_URL: str = "https://openrouter.ai/api/v1"
    NVIDIA_MODEL: str = "nvidia/nemotron-3-ultra-550b-a55b"
    DEFAULT_TEMPERATURE: float = 0.6
    DEFAULT_TOP_P: float = 0.9
    DEFAULT_MAX_TOKENS: int = 4096

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: str = "60/minute"
    CHAT_RATE_LIMIT: str = "30/minute"
    IMAGE_RATE_LIMIT: str = "10/minute"

    # Image Generation Configuration
    IMAGE_PROVIDER: str = "pollinations"  # pollinations | openai | stability | mock
    IMAGE_MODEL: str = "flux"             # flux | turbo | dall-e-3 | sd3
    IMAGE_API_KEY: Optional[str] = None
    IMAGE_API_BASE_URL: Optional[str] = None
    IMAGE_STORAGE_PROVIDER: str = "local" # local | s3
    MAX_IMAGE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB

    # File uploads & Storage
    UPLOAD_DIR: str = (
        "/tmp/uploads"
        if os.environ.get("VERCEL")
        else os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    )
    GENERATED_IMAGES_DIR: str = (
        "/tmp/uploads/generated"
        if os.environ.get("VERCEL")
        else os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "generated")
    )
    MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024  # 20 MB

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.GENERATED_IMAGES_DIR, exist_ok=True)
